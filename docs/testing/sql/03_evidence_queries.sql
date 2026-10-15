-- Consultas de evidencia. Correr cada bloque por separado:
-- A antes del envío, B después del envío, C integridad, D plan de ejecución del GET.

-- A. ESTADO ANTES DEL ENVÍO
-- A.1 Conteos
select 'news_posts publicadas' as dato, count(*) as valor from game.news_posts where published_at is not null
union all
select 'news_posts borrador', count(*) from game.news_posts where published_at is null
union all
select 'launch_subscriptions', count(*) from game.launch_subscriptions;

-- A.2 Consulta equivalente a GET /api/v1/news?page=0&size=5
select slug, title, summary, cover_key, published_at
from game.news_posts
where published_at is not null
order by published_at desc, slug
limit 5 offset 0;

-- A.3 Suscripciones existentes
select id, email, language, source, consented_at, created_at
from game.launch_subscriptions
order by created_at desc;

-- B. ESTADO DESPUÉS DEL ENVÍO
-- B.1 Últimos registros
select id, email, language, source, consented_at, created_at
from game.launch_subscriptions
order by created_at desc
limit 5;

-- B.2 Conteo después del envío
select count(*) as launch_subscriptions from game.launch_subscriptions;

-- B.3 Correos repetidos (debe regresar 0 filas)
select email, count(*) from game.launch_subscriptions group by email having count(*) > 1;

-- C. INTEGRIDAD
-- C.1 Columnas, tipos y valores por defecto
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'game' and table_name = 'launch_subscriptions'
order by ordinal_position;

-- C.2 Restricciones (PK, UNIQUE, CHECK)
select conname as restriccion,
       case contype when 'p' then 'PRIMARY KEY' when 'u' then 'UNIQUE' when 'c' then 'CHECK' end as tipo,
       pg_get_constraintdef(oid) as definicion
from pg_constraint
where conrelid = 'game.launch_subscriptions'::regclass
order by contype, conname;

-- C.3 Intentos de inserción inválidos (cada intento se deshace)
create or replace function pg_temp.lab_try_insert(p_email text, p_language text, p_source text)
returns text language plpgsql as $$
begin
  insert into game.launch_subscriptions (email, language, source, consented_at)
  values (p_email, p_language, p_source, now());
  raise exception 'ACEPTADO' using errcode = 'P0001';
exception
  when check_violation  then return 'RECHAZADO · CHECK · '  || sqlerrm;
  when unique_violation then return 'RECHAZADO · UNIQUE · ' || sqlerrm;
  when raise_exception  then return 'ACEPTADO (no esperado) · se deshizo';
end $$;

select caso, email, language, source, pg_temp.lab_try_insert(email, language, source) as resultado
from (values
  ('correo en mayúsculas', 'MAYUS@TDIMP.TEST',          'es', 'LANDING'),
  ('correo sin dominio',   'sin-dominio@',              'es', 'LANDING'),
  ('idioma no soportado',  'lab-c3@tdimp.test',         'fr', 'LANDING'),
  ('origen no válido',     'lab-c3@tdimp.test',         'es', 'EMAIL'),
  ('correo duplicado',     'preexistente01@tdimp.test', 'es', 'LANDING')
) as t(caso, email, language, source);

-- D. PLAN DE EJECUCIÓN DEL GET
explain (analyze, buffers, format text)
select slug, title, summary, cover_key, published_at
from game.news_posts
where published_at is not null
order by published_at desc, slug
limit 5 offset 0;
