-- =====================================================================
-- THE DAY I MADE THAT PROMISE · Chapter 1 catalog (Flyway V3)
--
-- Replaces the V2 placeholders (material_a, material_b, crimson_sword,
-- forged_amulet, amulet_recipe) with the real Chapter 1 items and recipes.
-- IDs are the contract with Unity: they match the `id` field of each
-- MaterialData / EquipmentItem / CraftingRecipe ScriptableObject.
--
-- Story milestone IDs are the StoryFlags the game sets (StoryFlags.Set),
-- so the game reports a milestone by sending the flag it just set.
-- Only catalogs change here: news_posts and launch_subscriptions are untouched.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Item types: the game also has consumables and upgrades
-- ---------------------------------------------------------------------
alter table items drop constraint ck_items_type;
alter table items add constraint ck_items_type
  check (type in ('MATERIAL', 'CONSUMABLE', 'EQUIPMENT', 'UPGRADE', 'KEY'));

-- ---------------------------------------------------------------------
-- 2. Remove the placeholders (no save can reference them yet)
-- ---------------------------------------------------------------------
delete from recipe_ingredients where recipe_id = 'amulet_recipe';
delete from recipes where id = 'amulet_recipe';
delete from items where id in ('material_a', 'material_b', 'crimson_sword', 'forged_amulet');

-- ---------------------------------------------------------------------
-- 3. Chapter 1 items and recipes
-- ---------------------------------------------------------------------
insert into items (id, name, type, rarity, description, icon_key, max_stack) values
  ('flor_destello',     'Flor destello',        'MATERIAL',   'COMMON', 'Flor que emite un brillo tenue. Suelta por los slimes.', 'flor_destello',     99),
  ('resto_slime',       'Resto de slime',       'MATERIAL',   'COMMON', 'Restos pegajosos que deja un slime.',                    'resto_slime',       99),
  ('concentrado_slime', 'Concentrado de slime', 'MATERIAL',   'COMMON', 'Esencia espesa extraída de un slime.',                   'concentrado_slime', 99),
  ('cuero_antiguo',     'Cuero antiguo',        'MATERIAL',   'COMMON', 'Cuero resistente que deja el golem antiguo.',            'cuero_antiguo',     99),
  ('alma_antigua',      'Alma antigua',         'MATERIAL',   'RARE',   'Fragmento de alma de un ser antiguo.',                   'alma_antigua',      99),
  ('circuito_antiguo',  'Circuito antiguo',     'MATERIAL',   'RARE',   'Mecanismo olvidado dentro del golem antiguo.',           'circuito_antiguo',  99),
  ('pocion',            'Poción',               'CONSUMABLE', 'COMMON', 'Restaura vida al usarla.',                               'pocion',            99),
  ('gota_amrita',       'Gota de Amrita',       'CONSUMABLE', 'EPIC',   'Ofrenda que despierta al jefe. Se consume al usarla.',   'gota_amrita',       10),
  ('casco_cuero',       'Casco de cuero',       'EQUIPMENT',  'COMMON', 'Casco ligero hecho con cuero antiguo.',                  'casco_cuero',        1),
  ('pechera_cuero',     'Pechera de cuero',     'EQUIPMENT',  'COMMON', 'Pechera resistente de cuero antiguo.',                   'pechera_cuero',      1),
  ('botas_cuero',       'Botas de cuero',       'EQUIPMENT',  'COMMON', 'Botas sencillas de cuero antiguo.',                      'botas_cuero',        1),
  ('modulo_espada',     'Módulo de espada',     'UPGRADE',    'EPIC',   'Mejora la espada. Aumenta el ataque.',                   'modulo_espada',      1),
  ('alma_pequena',      'Alma pequeña',         'KEY',        'RARE',   'Permite entrar al primer Santuario.',                    'alma_pequena',       1);

insert into recipes (id, result_item_id, result_quantity) values
  ('receta_pocion',        'pocion',        1),
  ('receta_gota_amrita',   'gota_amrita',   1),
  ('receta_modulo_espada', 'modulo_espada', 1),
  ('receta_casco_cuero',   'casco_cuero',   1),
  ('receta_pechera_cuero', 'pechera_cuero', 1),
  ('receta_botas_cuero',   'botas_cuero',   1);

insert into recipe_ingredients (recipe_id, item_id, quantity) values
  ('receta_pocion',        'flor_destello',      2),
  ('receta_pocion',        'concentrado_slime',  1),
  ('receta_gota_amrita',   'flor_destello',      5),
  ('receta_gota_amrita',   'alma_antigua',       3),
  ('receta_modulo_espada', 'alma_antigua',      10),
  ('receta_modulo_espada', 'circuito_antiguo',   5),
  ('receta_casco_cuero',   'cuero_antiguo',      2),
  ('receta_casco_cuero',   'resto_slime',        1),
  ('receta_pechera_cuero', 'cuero_antiguo',      5),
  ('receta_pechera_cuero', 'resto_slime',        3),
  ('receta_botas_cuero',   'cuero_antiguo',      1);

-- ---------------------------------------------------------------------
-- 4. Story milestones = Chapter 1 StoryFlags
--    Later chapters keep their V2 rows, moved after Chapter 1 in the order.
-- ---------------------------------------------------------------------
delete from story_milestones where id in ('prologue_fall', 'researcher_base', 'zone1_shrine', 'zone1_guardian');

update story_milestones set sort_order = 210 where id = 'zone2_shrine';
update story_milestones set sort_order = 220 where id = 'zone2_guardian';
update story_milestones set sort_order = 300 where id = 'final_boss';

insert into story_milestones (id, chapter, title, description, sort_order) values
  ('woke_up',            0, 'El despertar',          'Despertar en la Isla de las Flores.',                 10),
  ('has_sword',          0, 'La espada carmesí',     'Encontrar la espada en la cabaña.',                   20),
  ('met_researcher',     1, 'La investigadora',      'Conocer a Kaede en la Llanura del Eco.',              30),
  ('sanctuary_unlocked', 1, 'Primer santuario',      'Abrir la puerta del Santuario con el Alma pequeña.',  40),
  ('maiden_awakened',    1, 'La doncella despierta', 'Superar la prueba de la espada y despertar a Aoi.',   50),
  ('sword_upgraded',     1, 'Filo renovado',         'Forjar el Módulo de espada.',                         60),
  ('seal_opened',        1, 'El sello roto',         'Romper el sello del Bosque Quebrado.',                70),
  ('permit_obtained',    1, 'Primer guardián',       'Vencer a Varn y obtener su permiso.',                 80);
