-- =====================================================================
-- Laboratorio de pruebas · 01 LIMPIEZA
-- Deja la base local (tdimp, esquema game) sin datos de corridas anteriores.
-- No toca los catálogos de Flyway (logros, objetos, recetas, hitos de historia).
--
-- pgAdmin: abrir en Query Tool sobre la base tdimp y ejecutar (F5).
-- psql:    psql -h localhost -U tdimp -d tdimp -f docs/testing/sql/01_limpieza.sql
-- =====================================================================

set search_path to game;

begin;

-- Todas las suscripciones: en la base local solo existen las que crea el laboratorio.
delete from launch_subscriptions;

-- Todas las noticias: 02_carga.sql las vuelve a cargar (son las mismas que se publican en producción).
-- Incluye las 2 de ejemplo de V2 y las lab-* de versiones anteriores del laboratorio.
delete from news_posts;

-- Jugadores creados por el laboratorio (correos lab-*@tdimp.test). Sus sesiones, configuración,
-- partidas e historial se borran en cascada (on delete cascade en todas las tablas del jugador).
delete from players where email like 'lab-%@tdimp.test';

commit;

-- Resultado esperado: las tres en 0.
select 'launch_subscriptions' as tabla, count(*) as filas from launch_subscriptions
union all
select 'news_posts', count(*) from news_posts
union all
select 'players del laboratorio', count(*) from players where email like 'lab-%@tdimp.test'
order by tabla;
