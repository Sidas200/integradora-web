-- =====================================================================
-- Schema verification (leaves no data: everything runs in a transaction
-- that is rolled back). Usage:
--   psql "$DB_URL" -v ON_ERROR_STOP=1 -c "set search_path to game" -f verify_schema.sql
-- If something fails, psql stops with the assertion message.
-- =====================================================================
begin;

-- ---------- Test data ----------
insert into players (id, email, username, password_hash, privacy_accepted_at)
values ('00000000-0000-0000-0000-000000000001', 'felc@example.com', 'Felc', '{bcrypt}$2a$10$xxxxxxxx', now());
insert into settings (player_id) values ('00000000-0000-0000-0000-000000000001');

insert into saves (id, player_id, slot, active_character, current_chapter, extra_data)
values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000001', 1, 'TSUKI', 1, '{"v":1,"flags":{"sawIntro":true}}');
insert into save_stats (save_id, play_time_sec, enemies_defeated, items_crafted)
values ('00000000-0000-0000-0000-0000000000a1', 1800, 12, 1);

insert into inventory values ('00000000-0000-0000-0000-0000000000a1', 'material_a', 5);
insert into collected_pickups (save_id, pickup_id) values ('00000000-0000-0000-0000-0000000000a1', 'zone1:pickup_03');
insert into story_progress (save_id, milestone_id, play_time_sec, completed_at)
values ('00000000-0000-0000-0000-0000000000a1', 'prologue_fall', 300, now() - interval '20 minutes');
insert into player_achievements (player_id, achievement_id, unlocked_at)
values ('00000000-0000-0000-0000-000000000001', 'first_craft', now() - interval '5 minutes');
insert into play_sessions (id, save_id, started_at, ended_at, duration_sec, game_version)
values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1',
        now() - interval '40 minutes', now() - interval '10 minutes', 1700, '0.1.0');
insert into telemetry_events (id, save_id, type, data, occurred_at)
values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', 'CRAFT',
        '{"recipeId":"amulet_recipe"}', now() - interval '6 minutes');
insert into auth_sessions (player_id, family_id, token_hash, client, authenticated_at, expires_at)
values ('00000000-0000-0000-0000-000000000001', gen_random_uuid(), repeat('ab', 32), 'WEB', now(), now() + interval '30 days');

-- ---------- Views ----------
do $$
declare r record; n int;
begin
  select * into r from v_player_summary where player_id = '00000000-0000-0000-0000-000000000001';
  assert r.saves = 1,                   'summary: saves';
  assert r.play_time_sec = 1800,        'summary: play time';
  assert r.achievements_unlocked = 1,   'summary: unlocked achievements';
  assert r.achievements_total = 6,      'summary: total achievements';
  assert r.last_session_at is not null, 'summary: last session';

  select count(*) into n from v_player_history where player_id = '00000000-0000-0000-0000-000000000001';
  assert n = 3, 'history: must merge session + achievement + milestone';

  select count(*) into n from v_player_summary;   -- accounts without saves are listed too
  assert n >= 1, 'summary: accounts without saves';
end $$;

-- History order (most recent first): ACHIEVEMENT (-5 min), SESSION (-10 min), MILESTONE (-20 min)
do $$
declare types text;
begin
  select string_agg(type, ',' order by occurred_at desc) into types
  from v_player_history where player_id = '00000000-0000-0000-0000-000000000001';
  assert types = 'ACHIEVEMENT,SESSION,MILESTONE', 'history: order ' || types;
end $$;

-- ---------- Constraints that MUST fail ----------
create or replace function pg_temp.must_fail(sql text, label text) returns void language plpgsql as $$
begin
  begin
    execute sql;
  exception when others then
    return;   -- failed as expected
  end;
  raise exception 'Expected an error and got none: %', label;
end $$;

do $$ begin
  perform pg_temp.must_fail($q$insert into players (email, username, password_hash, privacy_accepted_at) values ('other@example.com','felc','x',now())$q$, 'case-insensitive duplicate username');
  perform pg_temp.must_fail($q$insert into players (email, username, password_hash, privacy_accepted_at) values ('Upper@Example.com','other','x',now())$q$, 'email not normalized');
  perform pg_temp.must_fail($q$insert into players (email, username, password_hash, privacy_accepted_at) values ('a@b.co','with space','x',now())$q$, 'invalid username');
  perform pg_temp.must_fail($q$insert into saves (player_id, slot) values ('00000000-0000-0000-0000-000000000001', 4)$q$, 'slot 4');
  perform pg_temp.must_fail($q$insert into saves (player_id, slot) values ('00000000-0000-0000-0000-000000000001', 1)$q$, 'repeated slot');
  perform pg_temp.must_fail($q$insert into saves (player_id, slot, active_character) values ('00000000-0000-0000-0000-000000000001', 2, 'Tsuki')$q$, 'character outside the enum');
  perform pg_temp.must_fail($q$insert into inventory values ('00000000-0000-0000-0000-0000000000a1', 'material_b', 0)$q$, 'quantity 0');
  perform pg_temp.must_fail($q$insert into inventory values ('00000000-0000-0000-0000-0000000000a1', 'missing_item', 1)$q$, 'unknown item');
  perform pg_temp.must_fail($q$insert into collected_pickups (save_id, pickup_id) values ('00000000-0000-0000-0000-0000000000a1', 'zone1:pickup_03')$q$, 'pickup collected twice');
  perform pg_temp.must_fail($q$insert into settings (player_id, music_volume) values (gen_random_uuid(), 150)$q$, 'volume > 100');
  perform pg_temp.must_fail($q$insert into play_sessions (id, save_id, started_at, ended_at) values (gen_random_uuid(), '00000000-0000-0000-0000-0000000000a1', now(), now() - interval '1 hour')$q$, 'end before start');
  perform pg_temp.must_fail($q$insert into telemetry_events (id, save_id, type, occurred_at) values (gen_random_uuid(), '00000000-0000-0000-0000-0000000000a1', 'enemy_drop', now())$q$, 'lowercase event type');
  perform pg_temp.must_fail($q$insert into auth_sessions (player_id, family_id, token_hash, client, authenticated_at, expires_at) values ('00000000-0000-0000-0000-000000000001', gen_random_uuid(), 'plain-text', 'WEB', now(), now() + interval '1 day')$q$, 'unhashed token');
  perform pg_temp.must_fail($q$update auth_sessions set revoked_at = now()$q$, 'revoke without reason');
  perform pg_temp.must_fail($q$insert into news_posts (slug, title, summary, content_md) values ('With Uppercase','Title','s','c')$q$, 'invalid slug');
end $$;

-- ---------- Telemetry idempotency ----------
insert into telemetry_events (id, save_id, type, occurred_at)
values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', 'CRAFT', now())
on conflict (id) do nothing;
do $$ begin
  assert (select count(*) from telemetry_events) = 1, 'resending the same event must not duplicate it';
end $$;

-- ---------- updated_at trigger ----------
do $$
declare after_update timestamptz;
begin
  update saves set updated_at = '2000-01-01' where slot = 1;     -- the trigger overwrites it
  select updated_at into after_update from saves where slot = 1;
  assert after_update > '2000-01-01', 'updated_at trigger';
end $$;

-- ---------- Account deletion: everything goes in cascade ----------
delete from players where id = '00000000-0000-0000-0000-000000000001';
do $$ begin
  assert (select count(*) from saves) = 0,               'cascade saves';
  assert (select count(*) from save_stats) = 0,          'cascade save_stats';
  assert (select count(*) from inventory) = 0,           'cascade inventory';
  assert (select count(*) from play_sessions) = 0,       'cascade play_sessions';
  assert (select count(*) from telemetry_events) = 0,    'cascade telemetry_events';
  assert (select count(*) from player_achievements) = 0, 'cascade player_achievements';
  assert (select count(*) from auth_sessions) = 0,       'cascade auth_sessions';
  assert (select count(*) from settings) = 0,            'cascade settings';
  assert (select count(*) from items) = 4,               'catalogs are NOT deleted';
end $$;

select 'OK: schema verified' as result;
rollback;
