-- =====================================================================
-- Application role (least privilege). Run ONCE per environment as the
-- schema owner (on Supabase: SQL editor, user postgres), AFTER the first
-- migration. It is not a Flyway migration: roles belong to the server and
-- the password is not versioned.
--
--   psql "$OWNER_URL" -v pass="'<password>'" -f docs/db/app_role.sql
--
-- The API connects as tdimp_app (DML only); Flyway uses the owner role (DDL).
-- Through Supabase's session pooler the user is written tdimp_app.<project-ref>.
-- =====================================================================
create role tdimp_app login password :pass;

grant usage on schema game to tdimp_app;
grant select, insert, update, delete on all tables in schema game to tdimp_app;

-- Tables created by future migrations (created by the owner role)
alter default privileges in schema game
  grant select, insert, update, delete on tables to tdimp_app;
