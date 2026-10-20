-- Limpia los datos generados por las pruebas. Después correr 01_seed_lab.sql.

set search_path to game;

begin;
delete from launch_subscriptions;
delete from news_posts where slug like 'lab-%';
commit;

select 'launch_subscriptions' as tabla, count(*) as filas from launch_subscriptions
union all
select 'news_posts', count(*) from news_posts;
