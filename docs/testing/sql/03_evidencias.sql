-- =====================================================================
-- Laboratorio de pruebas · 03 CONSULTAS DE EVIDENCIA
-- Cada bloque da UN solo resultado (pgAdmin solo muestra el último).
-- En pgAdmin: selecciona con el mouse todo el bloque, pulsa F5 y toma la captura.
--
--   A  ANTES del envío   -> evidencias/db/db-01-antes.png
--   B  DESPUÉS del envío -> evidencias/db/db-02-despues.png
--   C  INTEGRIDAD        -> evidencias/db/db-03-integridad.png
--   D  PLAN DEL GET      -> evidencias/db/db-04-explain.png
-- =====================================================================


-- ---------------------------------------------------------------------
-- A. ANTES DEL ENVÍO (justo después de 02_carga.sql)
--    Las 2 suscripciones previas y los totales del estado inicial.
-- ---------------------------------------------------------------------
select s.id, s.email, s.language, s.source, s.consented_at, s.created_at,
       count(*) over () as total_suscripciones,
       (select count(*) from game.news_posts where published_at is not null) as noticias_publicadas,
       (select count(*) from game.news_posts where published_at is null) as borradores,
       (select count(*) from game.achievements) as logros
from game.launch_subscriptions s
order by s.created_at desc;


-- ---------------------------------------------------------------------
-- B. DESPUÉS DEL ENVÍO (al terminar npm run lab:evidence y las capturas de DevTools)
--    Deben aparecer los correos lab-api-*, lab-online-* y lab-offline-* (y los que
--    enviaste a mano) con id y created_at generados por la base.
--    veces_registrado = 1 en todas las filas: no hay duplicados aunque la API
--    recibió el correo lab-api-* dos veces (caso API-08).
-- ---------------------------------------------------------------------
select id, email, language, source, consented_at, created_at,
       count(*) over () as total_suscripciones,
       count(*) over (partition by email) as veces_registrado,
       email = lower(email) as en_minusculas
from game.launch_subscriptions
order by created_at desc;


-- ---------------------------------------------------------------------
-- C. INTEGRIDAD: restricciones de la tabla + intentos inválidos.
--    Selecciona desde "create or replace" hasta el final del bloque y F5.
--    Cada intento se deshace; ninguno debe quedar ACEPTADO.
-- ---------------------------------------------------------------------
create or replace function pg_temp.lab_intento(p_email text, p_language text, p_source text)
returns text language plpgsql as $$
begin
  insert into game.launch_subscriptions (email, language, source, consented_at)
  values (p_email, p_language, p_source, now());
  raise exception 'ACEPTADO' using errcode = 'P0001';
exception
  when check_violation    then return 'RECHAZADO · CHECK (SQLSTATE 23514) · '    || sqlerrm;
  when unique_violation   then return 'RECHAZADO · UNIQUE (SQLSTATE 23505) · '   || sqlerrm;
  when not_null_violation then return 'RECHAZADO · NOT NULL (SQLSTATE 23502) · ' || sqlerrm;
  when raise_exception    then return 'ACEPTADO (no esperado) · se deshizo';
end $$;

select prueba, nombre, resultado
from (
  select 1 as orden, 'restricción' as prueba, conname as nombre,
         case contype when 'p' then 'PRIMARY KEY' when 'u' then 'UNIQUE' when 'c' then 'CHECK' when 'n' then 'NOT NULL' end
           || ' · ' || pg_get_constraintdef(oid) as resultado
  from pg_constraint
  where conrelid = 'game.launch_subscriptions'::regclass
  union all
  select 2, 'intento inválido', caso, pg_temp.lab_intento(email, language, source)
  from (values
    ('correo en mayúsculas', 'MAYUS@TDIMP.TEST',          'es', 'LANDING'),
    ('correo sin dominio',   'sin-dominio@',              'es', 'LANDING'),
    ('idioma no soportado',  'lab-c@tdimp.test',          'fr', 'LANDING'),
    ('origen no válido',     'lab-c@tdimp.test',          'es', 'EMAIL'),
    ('correo nulo',          null,                        'es', 'LANDING'),
    ('correo duplicado',     'preexistente01@tdimp.test', 'es', 'LANDING')
  ) as t(caso, email, language, source)
) as integridad
order by orden, nombre;


-- ---------------------------------------------------------------------
-- D. PLAN DE EJECUCIÓN de la consulta de GET /api/v1/news?page=0&size=6
--    Es la misma SQL que ejecuta NewsReaderJdbc. Con solo 13 filas PostgreSQL
--    prefiere leer la tabla completa (Seq Scan) porque es más barato; se apaga
--    esa opción solo en esta pestaña para mostrar que el índice parcial
--    ix_news_posts_published resuelve la consulta. Debe aparecer
--    "Index Scan using ix_news_posts_published". Selecciona las dos sentencias y F5.
-- ---------------------------------------------------------------------
set enable_seqscan = off;
explain (analyze, buffers, format text)
select slug, title, summary, content_md, cover_key, published_at
from game.news_posts
where published_at is not null
order by published_at desc, slug
limit 6 offset 0;