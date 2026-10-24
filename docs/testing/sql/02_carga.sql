-- =====================================================================
-- Laboratorio de pruebas · 02 CARGA
-- Estado inicial: 12 noticias publicadas (2 de V2 + 10 del laboratorio),
-- 1 borrador y 2 suscripciones previas. Los 6 logros ya vienen en V2.
-- Se puede correr varias veces: no duplica datos.
-- Al final verifica el estado y FALLA si no es el esperado.
--
-- Requisito: haber arrancado la API una vez (Flyway crea el esquema game con V1 y V2).
-- pgAdmin: Query Tool sobre tdimp, ejecutar (F5).
-- psql:    psql -h localhost -U tdimp -d tdimp -f docs/testing/sql/02_carga.sql
-- =====================================================================

set search_path to game;

begin;

insert into news_posts (slug, title, summary, content_md, cover_key, published_at) values
  ('lab-devlog-02-tsuki-controls', 'Devlog #2: controlar a Tsuki',
   'Movimiento isométrico, ataque y la sensación de cada golpe.',
   E'## Devlog #2\n\nTsuki se mueve en ocho direcciones sobre la cuadrícula isométrica.',
   'news_devlog02', now() - interval '20 days'),
  ('lab-devlog-03-first-zone', 'Devlog #3: la primera zona',
   'Del refugio a la primera zona exterior: cómo conectamos los mapas.',
   E'## Devlog #3\n\nLa base conecta con la primera zona exterior e interior.',
   'news_devlog03', now() - interval '18 days'),
  ('lab-devlog-04-enemies', 'Devlog #4: dos tipos de enemigo',
   'Cada enemigo avisa antes de atacar para que puedas reaccionar.',
   E'## Devlog #4\n\nDiseñamos dos arquetipos de enemigo común con aviso y ataque.',
   'news_devlog04', now() - interval '16 days'),
  ('lab-devlog-05-materials', 'Devlog #5: materiales e inventario',
   'Dos materiales, un inventario y totales que no se pierden al cambiar de zona.',
   E'## Devlog #5\n\nCada fuente de material se recoge una sola vez.',
   'news_devlog05', now() - interval '14 days'),
  ('lab-devlog-06-forge', 'Devlog #6: la forja',
   'La espada pasa de 15 a 25 de daño base con la primera mejora.',
   E'## Devlog #6\n\nLa receta **no consume nada** si no tienes los materiales.\n\n- Material A × 3\n- Material B × 1',
   'news_devlog06', now() - interval '12 days'),
  ('lab-devlog-07-seal', 'Devlog #7: el sello',
   'La puerta del guardián no se abre hasta que mejoras la espada.',
   E'## Devlog #7\n\nEl sello rechaza al jugador antes de cumplir el requisito.',
   'news_devlog07', now() - interval '10 days'),
  ('lab-devlog-08-guardian', 'Devlog #8: el primer guardián',
   'Dos patrones telegrafiados y una arena hecha para leerlos.',
   E'## Devlog #8\n\nEl primer guardián combina dos patrones de ataque.',
   'news_devlog08', now() - interval '8 days'),
  ('lab-devlog-09-save-points', 'Devlog #9: puntos de guardado',
   'Guardamos en la base y antes del jefe, sin duplicar recompensas.',
   E'## Devlog #9\n\nAl recargar vuelves a la zona segura con tus materiales.',
   'news_devlog09', now() - interval '6 days'),
  ('lab-pwa-launch', 'La PWA ya se puede instalar',
   'Consulta noticias y tu progreso desde el navegador, incluso sin conexión.',
   E'## PWA\n\nInstala la app desde Chrome o Edge y ábrela como una aplicación más.',
   'news_pwa', now() - interval '4 days'),
  ('lab-demo-date', 'Fecha de la demo',
   'El capítulo demo de dos zonas se presenta a finales de noviembre.',
   E'## Demo\n\nUn capítulo de 20 a 30 minutos: explorar, combatir, recolectar y forjar.',
   'news_demo', now() - interval '2 days'),
  -- Borrador: la API no debe devolverlo (published_at nulo).
  ('lab-draft-not-visible', 'Borrador interno',
   'Esta noticia es un borrador y la API no debe devolverla.',
   E'## Borrador', null, null)
on conflict (slug) do nothing;

insert into launch_subscriptions (email, language, source, consented_at) values
  ('preexistente01@tdimp.test', 'es', 'LANDING',       now() - interval '3 days'),
  ('preexistente02@tdimp.test', 'en', 'INSTALLED_PWA', now() - interval '1 day')
on conflict (email) do nothing;

commit;

-- Verificación del estado inicial: si algo no cuadra, el script termina con ERROR.
do $$
declare
  publicadas   int := (select count(*) from game.news_posts where published_at is not null);
  borradores   int := (select count(*) from game.news_posts where published_at is null);
  suscripciones int := (select count(*) from game.launch_subscriptions);
  logros       int := (select count(*) from game.achievements);
begin
  if publicadas <> 12 or borradores <> 1 or suscripciones <> 2 or logros <> 6 then
    raise exception 'Estado inicial incorrecto: publicadas=% (12), borradores=% (1), suscripciones=% (2), logros=% (6). Corre 01_limpieza.sql y luego este script.',
      publicadas, borradores, suscripciones, logros;
  end if;
  raise notice 'Estado inicial correcto: 12 noticias publicadas, 1 borrador, 2 suscripciones, 6 logros.';
end $$;

select 'news_posts publicadas' as dato, count(*) as valor from news_posts where published_at is not null
union all select 'news_posts borrador', count(*) from news_posts where published_at is null
union all select 'launch_subscriptions', count(*) from launch_subscriptions
union all select 'achievements', count(*) from achievements;