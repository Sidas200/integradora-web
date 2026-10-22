-- =====================================================================
-- Laboratorio de pruebas · 01 LIMPIEZA
-- Deja la base local (tdimp, esquema game) sin datos de corridas anteriores.
-- No toca el catálogo de Flyway (V2: 2 noticias, logros, objetos y recetas).
--
-- pgAdmin: abrir en Query Tool sobre la base tdimp y ejecutar (F5).
-- psql:    psql -h localhost -U tdimp -d tdimp -f docs/testing/sql/01_limpieza.sql
-- =====================================================================

set search_path to game;

begin;

-- Todas las suscripciones: en la base local solo existen las que crea el laboratorio.
delete from launch_subscriptions;

-- Noticias del laboratorio (las de V2 no empiezan con lab-).
delete from news_posts where slug like 'lab-%';

commit;

-- Resultado esperado: launch_subscriptions = 0, news_posts = 2 (las de V2).
select 'launch_subscriptions' as tabla, count(*) as filas from launch_subscriptions
union all
select 'news_posts', count(*) from news_posts
order by tabla;