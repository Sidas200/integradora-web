-- =====================================================================
-- THE DAY I MADE THAT PROMISE · Initial catalog data (Flyway V2)
-- Target: backend/src/main/resources/db/migration/V2__initial_data.sql
--
-- IDs are the CONTRACT with Unity: every ScriptableObject (CraftingMaterial,
-- EquipmentItem, CraftingRecipe, achievement, milestone) must have an identical
-- `id` field. Any catalog change goes in a new migration (V3__..., V4__...),
-- never by editing this one.
-- Display texts (name, description, title) are player-facing content in Spanish.
-- =====================================================================

insert into items (id, name, type, rarity, description, icon_key, max_stack) values
  ('material_a',    'Material A',      'MATERIAL',  'COMMON', 'Material básico recolectable.',             'material_a',    99),
  ('material_b',    'Material B',      'MATERIAL',  'RARE',   'Material que sueltan los enemigos.',        'material_b',    99),
  ('crimson_sword', 'Espada carmesí',  'KEY',       'EPIC',   'Una hoja apagada, como si algo le hubiera consumido el filo.', 'crimson_sword', 1),
  ('forged_amulet', 'Amuleto forjado', 'EQUIPMENT', 'COMMON', 'Primer equipo que se fabrica en la forja.', 'forged_amulet', 1);

insert into recipes (id, result_item_id, result_quantity) values
  ('amulet_recipe', 'forged_amulet', 1);

insert into recipe_ingredients (recipe_id, item_id, quantity) values
  ('amulet_recipe', 'material_a', 3),
  ('amulet_recipe', 'material_b', 1);

insert into achievements (id, name, description, icon_key, hidden, sort_order) values
  ('first_material', 'Primeros pasos',      'Recolecta tu primer material.',          'achievement_material', false, 10),
  ('first_craft',    'El poder se fabrica', 'Fabrica tu primer objeto en la forja.',  'achievement_forge',    false, 20),
  ('sky_hunter_10',  'Cazador del cielo',   'Derrota a 10 enemigos.',                 'achievement_hunter',   false, 30),
  ('first_permit',   'Primer permiso',      'Derrota al guardián de la primera zona.', 'achievement_guardian', false, 40),
  ('rulebreaker',    'Rulebreaker',         'Descubre el significado de la marca.',   'achievement_mark',     true,  50),
  ('the_promise',    'La promesa',          'Llega al final de la historia.',         'achievement_promise',  true,  60);

insert into story_milestones (id, chapter, title, description, sort_order) values
  ('prologue_fall',   0, 'La caída',             'Despertar en el campo de flores flotante.',      10),
  ('researcher_base', 1, 'La base oculta',       'Llegar al escondite de la investigadora.',       20),
  ('zone1_shrine',    1, 'Primer santuario',     'Encontrar el santuario de la primera doncella.', 30),
  ('zone1_guardian',  1, 'Primer guardián',      'Obtener el permiso del primer guardián.',        40),
  ('zone2_shrine',    2, 'Segundo santuario',    'Encontrar el santuario de la segunda doncella.', 50),
  ('zone2_guardian',  2, 'Segundo guardián',     'Obtener el permiso del segundo guardián.',       60),
  ('final_boss',      3, 'Ante el Gran Juzgado', 'Enfrentar al jefe final.',                       70);

insert into news_posts (slug, title, summary, content_md, cover_key, published_at) values
  ('announcing-the-day-i-made-that-promise',
   'Anunciamos The Day I Made That Promise',
   'Un RPG de acción 2D isométrico que cabe en una tarde: el poder no se encuentra, se fabrica.',
   E'## Una promesa que desafiará al cielo\n\nHex Studio presenta su primer proyecto...',
   'news_announcement',
   now()),
  ('devlog-01-forge-and-materials',
   'Devlog #1: la forja y los materiales',
   'Cómo funciona el bucle de combatir, recolectar y fabricar.',
   E'## Devlog #1\n\nCada enemigo derrotado se convierte en material...',
   'news_devlog01',
   now());
