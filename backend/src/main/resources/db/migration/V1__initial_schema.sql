-- =====================================================================
-- THE DAY I MADE THAT PROMISE · Database schema (Flyway V1)
-- Target:  backend/src/main/resources/db/migration/V1__initial_schema.sql
-- Engine:  PostgreSQL 15+ (Supabase used as plain PostgreSQL)
--
-- Flyway creates and pins the schema with:
--   spring.flyway.schemas=game
--   spring.flyway.default-schema=game
-- To run it by hand (psql / Supabase SQL editor) execute first:
--   create schema if not exists game;  set search_path to game;
--
-- Conventions
--   * Tables and columns in English, snake_case.
--   * Timestamps: created_at / updated_at (timestamptz, UTC).
--   * Enumerations in UPPERCASE = Java enum constant (@Enumerated(STRING)).
--   * Catalog IDs in lowercase snake_case ('material_a'); they are the contract
--     with Unity's ScriptableObjects.
--   * Business logic lives in Spring Boot (business layer); the database only
--     keeps integrity (PK/FK/CHECK/UNIQUE) and the updated_at timestamp.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Technical helper: keep updated_at current
-- ---------------------------------------------------------------------
create or replace function fn_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- =====================================================================
-- 1. ACCOUNTS AND AUTHENTICATION SESSIONS
-- =====================================================================
create table players (
  id                  uuid        primary key default gen_random_uuid(),
  email               text        not null,
  username            text        not null,
  password_hash       text        not null,
  privacy_accepted_at timestamptz not null,               -- proof of consent (privacy notice)
  last_login_at       timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint ck_players_email    check (email = lower(email) and char_length(email) between 6 and 254 and email like '%_@_%._%'),
  constraint ck_players_username check (username ~ '^[A-Za-z0-9_]{3,20}$')
);
create unique index ux_players_email    on players (email);
create unique index ux_players_username on players (lower(username));   -- "Tsuki" and "tsuki" are the same user

-- Refresh tokens (one per device / login). Only the HASH is stored, never the token.
create table auth_sessions (
  id                uuid        primary key default gen_random_uuid(),
  player_id         uuid        not null references players (id) on delete cascade,
  family_id         uuid        not null,               -- rotation chain of a single login
  token_hash        text        not null,               -- SHA-256 hex of the refresh token
  client            text        not null,
  user_agent        text,
  authenticated_at  timestamptz not null,               -- moment of the login (auth_time claim)
  created_at        timestamptz not null default now(),
  expires_at        timestamptz not null,
  last_used_at      timestamptz,
  revoked_at        timestamptz,
  revocation_reason text,
  replaced_by       uuid        references auth_sessions (id) on delete set null,
  constraint ux_auth_sessions_token unique (token_hash),
  constraint ck_auth_sessions_hash       check (token_hash ~ '^[0-9a-f]{64}$'),
  constraint ck_auth_sessions_client     check (client in ('WEB', 'UNITY_PC', 'MOBILE')),
  constraint ck_auth_sessions_user_agent check (user_agent is null or char_length(user_agent) <= 300),
  constraint ck_auth_sessions_expiry     check (expires_at > created_at),
  constraint ck_auth_sessions_reason     check (
    (revoked_at is null and revocation_reason is null) or
    (revoked_at is not null and revocation_reason is not null and revocation_reason in   -- "is not null": a CHECK on NULL passes
      ('LOGOUT', 'ROTATED', 'REUSE_DETECTED', 'PASSWORD_CHANGED', 'REVOKED_BY_USER', 'ACCOUNT_DELETED')))
);
create index ix_auth_sessions_active  on auth_sessions (player_id) where revoked_at is null;
create index ix_auth_sessions_family  on auth_sessions (family_id);
create index ix_auth_sessions_expires on auth_sessions (expires_at);          -- scheduled cleanup

create table settings (
  player_id     uuid        primary key references players (id) on delete cascade,
  music_volume  smallint    not null default 80,
  sfx_volume    smallint    not null default 80,
  language      text        not null default 'es',
  fullscreen    boolean     not null default true,
  controls      jsonb       not null default '{}'::jsonb,
  updated_at    timestamptz not null default now(),
  constraint ck_settings_music_volume check (music_volume between 0 and 100),
  constraint ck_settings_sfx_volume   check (sfx_volume   between 0 and 100),
  constraint ck_settings_language     check (language in ('es', 'en')),
  constraint ck_settings_controls     check (jsonb_typeof(controls) = 'object')
);

-- =====================================================================
-- 2. CATALOGS (fixed data; loaded by migrations, read-only for clients)
-- =====================================================================
create table items (
  id          text     primary key,
  name        text     not null,
  type        text     not null,
  rarity      text     not null default 'COMMON',
  description text,
  icon_key    text,                                   -- the PWA resolves /img/items/{icon_key}.webp
  max_stack   smallint not null default 99,
  constraint ck_items_id        check (id ~ '^[a-z0-9_]{2,40}$'),
  constraint ck_items_type      check (type in ('MATERIAL', 'EQUIPMENT', 'KEY')),
  constraint ck_items_rarity    check (rarity in ('COMMON', 'RARE', 'EPIC')),
  constraint ck_items_max_stack check (max_stack between 1 and 999)
);

create table recipes (
  id              text     primary key,
  result_item_id  text     not null references items (id),
  result_quantity smallint not null default 1,
  constraint ck_recipes_id       check (id ~ '^[a-z0-9_]{2,40}$'),
  constraint ck_recipes_quantity check (result_quantity > 0)
);

create table recipe_ingredients (
  recipe_id text     not null references recipes (id) on delete cascade,
  item_id   text     not null references items (id),
  quantity  smallint not null,
  primary key (recipe_id, item_id),
  constraint ck_recipe_ingredients_quantity check (quantity > 0)
);

create table achievements (
  id          text     primary key,
  name        text     not null,
  description text     not null,
  icon_key    text,
  hidden      boolean  not null default false,          -- the API masks name/description while locked
  sort_order  smallint not null default 0,
  constraint ck_achievements_id check (id ~ '^[a-z0-9_]{2,40}$')
);

-- Story milestones (chapters, shrines, guardians...).
create table story_milestones (
  id          text     primary key,
  chapter     smallint not null,
  title       text     not null,
  description text,
  sort_order  smallint not null,
  constraint ck_story_milestones_id      check (id ~ '^[a-z0-9_]{2,40}$'),
  constraint ck_story_milestones_chapter check (chapter between 0 and 20),
  constraint ux_story_milestones_order   unique (sort_order)
);

-- =====================================================================
-- 3. SAVES (cloud save system)
-- =====================================================================
create table saves (
  id                uuid        primary key default gen_random_uuid(),
  player_id         uuid        not null references players (id) on delete cascade,
  slot              smallint    not null,
  active_character  text        not null default 'TSUKI',
  current_chapter   smallint    not null default 1,
  current_scene     text,
  pos_x             real,
  pos_y             real,
  health            integer,
  extra_data        jsonb       not null default '{}'::jsonb,   -- ONLY what has no table of its own (see README §6.3)
  version           integer     not null default 0,             -- optimistic locking (@Version) across devices
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint ux_saves_player_slot unique (player_id, slot),     -- also serves as the per-player index
  constraint ck_saves_slot      check (slot between 1 and 3),
  constraint ck_saves_character check (active_character in ('TSUKI', 'HIKARI')),
  constraint ck_saves_chapter   check (current_chapter between 0 and 20),
  constraint ck_saves_health    check (health is null or health >= 0),
  constraint ck_saves_extra     check (jsonb_typeof(extra_data) = 'object')
);

create table save_stats (
  save_id             uuid        primary key references saves (id) on delete cascade,
  play_time_sec       integer     not null default 0,
  enemies_defeated    integer     not null default 0,
  deaths              integer     not null default 0,
  materials_collected integer     not null default 0,
  items_crafted       integer     not null default 0,
  updated_at          timestamptz not null default now(),
  constraint ck_save_stats_non_negative check (
    play_time_sec >= 0 and enemies_defeated >= 0 and deaths >= 0
    and materials_collected >= 0 and items_crafted >= 0)
);

-- =====================================================================
-- 4. INVENTORY AND WORLD STATE (per save)
-- =====================================================================
create table inventory (
  save_id  uuid    not null references saves (id) on delete cascade,
  item_id  text    not null references items (id),
  quantity integer not null,
  primary key (save_id, item_id),
  constraint ck_inventory_quantity check (quantity > 0)          -- quantity 0 = the row is deleted
);

create table collected_pickups (
  save_id      uuid        not null references saves (id) on delete cascade,
  pickup_id    text        not null,
  collected_at timestamptz not null default now(),
  primary key (save_id, pickup_id),                               -- a pickup cannot be collected twice (GAME-46)
  constraint ck_collected_pickups_id check (pickup_id ~ '^[A-Za-z0-9_.:-]{1,100}$')
);

create table interacted_objects (
  save_id    uuid        not null references saves (id) on delete cascade,
  object_id  text        not null,
  state      text        not null,
  updated_at timestamptz not null default now(),
  primary key (save_id, object_id),
  constraint ck_interacted_objects_id    check (object_id ~ '^[A-Za-z0-9_.:-]{1,100}$'),
  constraint ck_interacted_objects_state check (state ~ '^[A-Z_]{2,30}$')
);

create table story_progress (
  save_id       uuid        not null references saves (id) on delete cascade,
  milestone_id  text        not null references story_milestones (id),
  play_time_sec integer,
  completed_at  timestamptz not null default now(),
  primary key (save_id, milestone_id),                            -- row exists = completed
  constraint ck_story_progress_time check (play_time_sec is null or play_time_sec >= 0)
);

-- =====================================================================
-- 5. PLAYER ACHIEVEMENTS (per account, not per save)
-- =====================================================================
create table player_achievements (
  player_id      uuid        not null references players (id) on delete cascade,
  achievement_id text        not null references achievements (id),
  unlocked_at    timestamptz not null default now(),
  primary key (player_id, achievement_id)
);

-- =====================================================================
-- 6. PLAY SESSIONS AND TELEMETRY
--    IDs are generated by the client (UUID) so resending is idempotent.
-- =====================================================================
create table play_sessions (
  id           uuid        primary key,
  save_id      uuid        not null references saves (id) on delete cascade,
  started_at   timestamptz not null,
  ended_at     timestamptz,
  duration_sec integer,                                           -- ACTIVE time (no pauses) measured by the game
  platform     text        not null default 'WINDOWS',
  game_version text,
  received_at  timestamptz not null default now(),
  constraint ck_play_sessions_end      check (ended_at is null or ended_at >= started_at),
  constraint ck_play_sessions_duration check (duration_sec is null or (duration_sec >= 0 and ended_at is not null)),
  constraint ck_play_sessions_platform check (platform in ('WINDOWS', 'MACOS', 'LINUX')),
  constraint ck_play_sessions_version  check (game_version is null or game_version ~ '^[0-9A-Za-z.+-]{1,30}$')
);
create index ix_play_sessions_save on play_sessions (save_id, started_at desc);

create table telemetry_events (
  id          uuid        primary key,
  save_id     uuid        not null references saves (id) on delete cascade,
  type        text        not null,
  data        jsonb       not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  constraint ck_telemetry_events_type check (type in
    ('ENEMY_DEFEATED', 'ENEMY_DROP', 'PICKUP', 'CRAFT', 'DEATH', 'BOSS_DEFEATED', 'MILESTONE_COMPLETED')),
  constraint ck_telemetry_events_data check (jsonb_typeof(data) = 'object')
);
create index ix_telemetry_events_save on telemetry_events (save_id, occurred_at);
create index ix_telemetry_events_type on telemetry_events (type, occurred_at);

-- =====================================================================
-- 7. PUBLIC PWA CONTENT
-- =====================================================================
create table news_posts (
  id           uuid        primary key default gen_random_uuid(),
  slug         text        not null,
  title        text        not null,
  summary      text        not null,
  content_md   text        not null,                              -- Markdown; the PWA renders it without raw HTML
  cover_key    text,
  published_at timestamptz,                                       -- null = draft
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint ux_news_posts_slug    unique (slug),
  constraint ck_news_posts_slug    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  constraint ck_news_posts_title   check (char_length(title) between 3 and 120),
  constraint ck_news_posts_summary check (char_length(summary) <= 280)
);
create index ix_news_posts_published on news_posts (published_at desc) where published_at is not null;

-- Launch notification list (public form on the landing page).
create table launch_subscriptions (
  id           uuid        primary key default gen_random_uuid(),
  email        text        not null,
  language     text        not null default 'es',
  source       text        not null default 'LANDING',
  consented_at timestamptz not null,
  created_at   timestamptz not null default now(),
  constraint ux_launch_subscriptions_email    unique (email),
  constraint ck_launch_subscriptions_email    check (email = lower(email) and char_length(email) between 6 and 254 and email like '%_@_%._%'),
  constraint ck_launch_subscriptions_language check (language in ('es', 'en')),
  constraint ck_launch_subscriptions_source   check (source in ('LANDING', 'INSTALLED_PWA'))
);

-- =====================================================================
-- 8. updated_at TRIGGERS
-- =====================================================================
create trigger trg_players_updated_at            before update on players            for each row execute function fn_touch_updated_at();
create trigger trg_settings_updated_at           before update on settings           for each row execute function fn_touch_updated_at();
create trigger trg_saves_updated_at              before update on saves              for each row execute function fn_touch_updated_at();
create trigger trg_save_stats_updated_at         before update on save_stats         for each row execute function fn_touch_updated_at();
create trigger trg_interacted_objects_updated_at before update on interacted_objects for each row execute function fn_touch_updated_at();
create trigger trg_news_posts_updated_at         before update on news_posts         for each row execute function fn_touch_updated_at();

-- =====================================================================
-- 9. READ VIEWS (read models for the PWA)
-- =====================================================================

-- Account summary for the dashboard.
create view v_player_summary as
select p.id                                    as player_id,
       coalesce(sv.saves, 0)                   as saves,
       coalesce(st.play_time_sec, 0)           as play_time_sec,
       coalesce(st.enemies_defeated, 0)        as enemies_defeated,
       coalesce(st.items_crafted, 0)           as items_crafted,
       coalesce(ac.unlocked, 0)                as achievements_unlocked,
       (select count(*) from achievements)     as achievements_total,
       ps.last_session_at
from players p
left join lateral (select count(*) as saves
                   from saves where player_id = p.id) sv on true
left join lateral (select sum(s.play_time_sec)    as play_time_sec,
                          sum(s.enemies_defeated) as enemies_defeated,
                          sum(s.items_crafted)    as items_crafted
                   from save_stats s join saves sa on sa.id = s.save_id
                   where sa.player_id = p.id) st on true
left join lateral (select count(*) as unlocked
                   from player_achievements where player_id = p.id) ac on true
left join lateral (select max(coalesce(s.ended_at, s.started_at)) as last_session_at
                   from play_sessions s join saves sa on sa.id = s.save_id
                   where sa.player_id = p.id) ps on true;

-- Unified timeline ("history"): play sessions + achievements + story milestones.
create view v_player_history as
select sa.player_id,
       'SESSION'::text                     as type,
       s.id::text                          as reference_id,
       coalesce(s.ended_at, s.started_at)  as occurred_at,
       sa.slot                             as slot,
       null::text                          as title,
       s.duration_sec                      as value_sec
from play_sessions s
join saves sa on sa.id = s.save_id
union all
select pa.player_id, 'ACHIEVEMENT', pa.achievement_id, pa.unlocked_at, null, a.name, null
from player_achievements pa
join achievements a on a.id = pa.achievement_id
union all
select sa.player_id, 'MILESTONE', sp.milestone_id, sp.completed_at, sa.slot, m.title, sp.play_time_sec
from story_progress sp
join saves sa            on sa.id = sp.save_id
join story_milestones m  on m.id = sp.milestone_id;

-- =====================================================================
-- 10. DEFENSE IN DEPTH ON SUPABASE
--     No client talks to the database directly: only Spring Boot. If the
--     schema lives in Supabase, any access by the Data API roles is revoked.
--     (On a local PostgreSQL those roles do not exist and the block is a no-op.)
-- =====================================================================
do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on schema %I from %I', current_schema(), r);
      execute format('revoke all on all tables in schema %I from %I', current_schema(), r);
    end if;
  end loop;
end;
$$;
