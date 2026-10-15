-- Crea el esquema game y aplica V1 y V2 (docs/db). No modifica el esquema public.
-- psql "$DB_OWNER_URL" -v ON_ERROR_STOP=1 -f docs/testing/sql/00_provision_schema.sql
-- Revertir: drop schema game cascade;

create schema if not exists game;
set search_path to game;

\ir ../../db/V1__initial_schema.sql
\ir ../../db/V2__initial_data.sql
