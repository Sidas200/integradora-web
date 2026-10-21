package mx.utch.tdimp.api.repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import mx.utch.tdimp.api.config.QueryTimer;
import mx.utch.tdimp.api.dto.SaveDataDto;
import mx.utch.tdimp.api.dto.SaveDetailDto;
import mx.utch.tdimp.api.dto.SaveStatsDto;
import mx.utch.tdimp.api.dto.SaveSummaryDto;
import mx.utch.tdimp.api.model.SaveRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

@Repository
class SaveRepositoryJdbc implements SaveRepository {

  private static final Logger log = LoggerFactory.getLogger(SaveRepositoryJdbc.class);
  private static final TypeReference<Map<String, Object>> OBJECT = new TypeReference<>() { };

  private static final String SUMMARY = """
      select s.slot, s.active_character, s.current_chapter, s.version, s.updated_at,
             coalesce(st.play_time_sec, 0)                                        as play_time_sec,
             (select count(*) from story_progress sp where sp.save_id = s.id)     as milestones_completed,
             (select count(*) from story_milestones)                              as milestones_total,
             lm.id as last_milestone_id, lm.title as last_milestone_title
      from saves s
      left join save_stats st on st.save_id = s.id
      left join lateral (select m.id, m.title
                         from story_progress sp join story_milestones m on m.id = sp.milestone_id
                         where sp.save_id = s.id
                         order by sp.completed_at desc, m.sort_order desc
                         limit 1) lm on true
      where s.player_id = :playerId
      """;

  private final JdbcClient jdbc;
  private final JsonMapper json;

  SaveRepositoryJdbc(JdbcClient jdbc, JsonMapper json) {
    this.jdbc = jdbc;
    this.json = json;
  }

  @Override
  public List<SaveSummaryDto> listSummaries(UUID playerId) {
    var timed = QueryTimer.time(() -> jdbc.sql(SUMMARY + " order by s.slot")
        .param("playerId", playerId)
        .query(SaveRepositoryJdbc::mapSummary)
        .list());
    log.debug("BD SELECT saves (resumen) -> {} filas en {} ms", timed.value().size(), String.format("%.1f", timed.millis()));
    return timed.value();
  }

  @Override
  public Optional<SaveSummaryDto> findSummary(UUID playerId, int slot) {
    return QueryTimer.time(() -> jdbc.sql(SUMMARY + " and s.slot = :slot")
        .param("playerId", playerId)
        .param("slot", slot)
        .query(SaveRepositoryJdbc::mapSummary)
        .optional()).value();
  }

  @Override
  public Optional<SaveRecord> find(UUID playerId, int slot) {
    return findRecord(playerId, slot, "");
  }

  @Override
  public Optional<SaveRecord> findForUpdate(UUID playerId, int slot) {
    return findRecord(playerId, slot, " for update");
  }

  private Optional<SaveRecord> findRecord(UUID playerId, int slot, String lock) {
    return QueryTimer.time(() -> jdbc.sql(
            "select id, slot, version, updated_at from saves where player_id = :playerId and slot = :slot" + lock)
        .param("playerId", playerId)
        .param("slot", slot)
        .query(SaveRepositoryJdbc::mapRecord)
        .optional()).value();
  }

  @Override
  public SaveRecord insert(UUID playerId, int slot, SaveDataDto d) {
    var timed = QueryTimer.time(() -> jdbc.sql("""
            insert into saves (player_id, slot, active_character, current_chapter, current_scene, pos_x, pos_y, health,
                               extra_data, version)
            values (:playerId, :slot, :character, :chapter, :scene, :posX, :posY, :health, cast(:extra as jsonb), 1)
            returning id, slot, version, updated_at
            """)
        .param("playerId", playerId)
        .param("slot", slot)
        .params(saveColumns(d))
        .query(SaveRepositoryJdbc::mapRecord)
        .single());
    log.debug("BD INSERT saves (ranura {}) -> versión 1 en {} ms", slot, String.format("%.1f", timed.millis()));
    return timed.value();
  }

  @Override
  public SaveRecord update(UUID saveId, SaveDataDto d) {
    var timed = QueryTimer.time(() -> jdbc.sql("""
            update saves
            set active_character = :character, current_chapter = :chapter, current_scene = :scene,
                pos_x = :posX, pos_y = :posY, health = :health, extra_data = cast(:extra as jsonb),
                version = version + 1
            where id = :saveId
            returning id, slot, version, updated_at
            """)
        .param("saveId", saveId)
        .params(saveColumns(d))
        .query(SaveRepositoryJdbc::mapRecord)
        .single());
    log.debug("BD UPDATE saves -> versión {} en {} ms", timed.value().version(), String.format("%.1f", timed.millis()));
    return timed.value();
  }

  private Map<String, Object> saveColumns(SaveDataDto d) {
    var params = new HashMap<String, Object>();
    params.put("character", d.activeCharacter());
    params.put("chapter", d.currentChapter());
    params.put("scene", d.currentScene());
    params.put("posX", d.position() == null ? null : d.position().x());
    params.put("posY", d.position() == null ? null : d.position().y());
    params.put("health", d.health());
    params.put("extra", json.writeValueAsString(d.extraData()));
    return params;
  }

  @Override
  public void replaceContents(UUID saveId, SaveDataDto d) {
    var stats = d.stats();
    QueryTimer.time(() -> jdbc.sql("""
            insert into save_stats (save_id, play_time_sec, enemies_defeated, deaths, materials_collected, items_crafted)
            values (:saveId, :playTime, :enemies, :deaths, :materials, :crafted)
            on conflict (save_id) do update
              set play_time_sec = excluded.play_time_sec, enemies_defeated = excluded.enemies_defeated,
                  deaths = excluded.deaths, materials_collected = excluded.materials_collected,
                  items_crafted = excluded.items_crafted
            """)
        .param("saveId", saveId)
        .param("playTime", stats.playTimeSec())
        .param("enemies", stats.enemiesDefeated())
        .param("deaths", stats.deaths())
        .param("materials", stats.materialsCollected())
        .param("crafted", stats.itemsCrafted())
        .update());

    for (String table : List.of("inventory", "collected_pickups", "interacted_objects", "story_progress")) {
      QueryTimer.time(() -> jdbc.sql("delete from " + table + " where save_id = :saveId").param("saveId", saveId).update());
    }

    // Cada lista entra en UNA consulta (jsonb_to_recordset), no una por fila.
    insertRows(saveId, """
        insert into inventory (save_id, item_id, quantity)
        select :saveId, x.item_id, x.quantity from jsonb_to_recordset(cast(:rows as jsonb)) as x(item_id text, quantity int)
        """, d.inventory().stream().map(i -> Map.<String, Object>of("item_id", i.itemId(), "quantity", i.quantity())).toList());

    insertRows(saveId, """
        insert into collected_pickups (save_id, pickup_id)
        select distinct :saveId, x.pickup_id from jsonb_to_recordset(cast(:rows as jsonb)) as x(pickup_id text)
        """, d.collectedPickups().stream().map(p -> Map.<String, Object>of("pickup_id", p)).toList());

    insertRows(saveId, """
        insert into interacted_objects (save_id, object_id, state)
        select :saveId, x.object_id, x.state from jsonb_to_recordset(cast(:rows as jsonb)) as x(object_id text, state text)
        """, d.objects().stream().map(o -> Map.<String, Object>of("object_id", o.objectId(), "state", o.state())).toList());

    insertRows(saveId, """
        insert into story_progress (save_id, milestone_id, play_time_sec, completed_at)
        select :saveId, x.milestone_id, x.play_time_sec, x.completed_at
        from jsonb_to_recordset(cast(:rows as jsonb)) as x(milestone_id text, play_time_sec int, completed_at timestamptz)
        """, d.completedMilestones().stream().map(m -> {
          var row = new HashMap<String, Object>();
          row.put("milestone_id", m.milestoneId());
          row.put("play_time_sec", m.playTimeSec());
          row.put("completed_at", m.completedAt().toString());
          return (Map<String, Object>) row;
        }).toList());

    log.debug("BD guardado reemplazado: {} items, {} pickups, {} objetos, {} hitos", d.inventory().size(),
        d.collectedPickups().size(), d.objects().size(), d.completedMilestones().size());
  }

  private void insertRows(UUID saveId, String sql, List<Map<String, Object>> rows) {
    if (rows.isEmpty()) {
      return;
    }
    QueryTimer.time(() -> jdbc.sql(sql)
        .param("saveId", saveId)
        .param("rows", json.writeValueAsString(rows))
        .update());
  }

  @Override
  public SaveDataDto readData(SaveRecord save) {
    UUID id = save.id();
    var head = QueryTimer.time(() -> jdbc.sql("""
            select active_character, current_chapter, current_scene, pos_x, pos_y, health, extra_data::text as extra
            from saves where id = :id
            """)
        .param("id", id)
        .query((rs, n) -> new SaveHead(rs.getString("active_character"), rs.getInt("current_chapter"),
            rs.getString("current_scene"), rs.getObject("pos_x", Float.class), rs.getObject("pos_y", Float.class),
            rs.getObject("health", Integer.class), rs.getString("extra")))
        .single()).value();

    var inventory = QueryTimer.time(() -> jdbc.sql("select item_id, quantity from inventory where save_id = :id order by item_id")
        .param("id", id)
        .query((rs, n) -> new SaveDataDto.InventoryEntry(rs.getString("item_id"), rs.getInt("quantity")))
        .list()).value();
    var pickups = QueryTimer.time(() -> jdbc.sql("select pickup_id from collected_pickups where save_id = :id order by pickup_id")
        .param("id", id)
        .query(String.class)
        .list()).value();
    var objects = QueryTimer.time(() -> jdbc.sql("select object_id, state from interacted_objects where save_id = :id order by object_id")
        .param("id", id)
        .query((rs, n) -> new SaveDataDto.ObjectState(rs.getString("object_id"), rs.getString("state")))
        .list()).value();
    var milestones = QueryTimer.time(() -> jdbc.sql("""
            select milestone_id, play_time_sec, completed_at from story_progress where save_id = :id order by completed_at
            """)
        .param("id", id)
        .query((rs, n) -> new SaveDataDto.CompletedMilestone(rs.getString("milestone_id"),
            rs.getObject("play_time_sec", Integer.class), rs.getObject("completed_at", OffsetDateTime.class)))
        .list()).value();

    return new SaveDataDto(
        save.version(),
        head.character(),
        head.chapter(),
        head.scene(),
        head.posX() == null || head.posY() == null ? null
            : new SaveDataDto.Position(head.posX().doubleValue(), head.posY().doubleValue()),
        head.health(),
        readStats(id),
        inventory,
        pickups,
        objects,
        milestones,
        json.readValue(head.extra(), OBJECT));
  }

  private record SaveHead(String character, int chapter, String scene, Float posX, Float posY, Integer health,
                          String extra) {
  }

  @Override
  public SaveStatsDto readStats(UUID saveId) {
    return QueryTimer.time(() -> jdbc.sql("""
            select play_time_sec, enemies_defeated, deaths, materials_collected, items_crafted
            from save_stats where save_id = :saveId
            """)
        .param("saveId", saveId)
        .query((rs, n) -> new SaveStatsDto(rs.getInt("play_time_sec"), rs.getInt("enemies_defeated"), rs.getInt("deaths"),
            rs.getInt("materials_collected"), rs.getInt("items_crafted")))
        .optional()).value()
        .orElse(new SaveStatsDto(0, 0, 0, 0, 0));
  }

  @Override
  public List<SaveDetailDto.Item> readInventoryDetail(UUID saveId) {
    return QueryTimer.time(() -> jdbc.sql("""
            select i.id, i.name, i.type, i.rarity, i.icon_key, inv.quantity
            from inventory inv join items i on i.id = inv.item_id
            where inv.save_id = :saveId
            order by i.type, i.name
            """)
        .param("saveId", saveId)
        .query((rs, n) -> new SaveDetailDto.Item(rs.getString("id"), rs.getString("name"), rs.getString("type"),
            rs.getString("rarity"), rs.getString("icon_key"), rs.getInt("quantity")))
        .list()).value();
  }

  @Override
  public List<SaveDetailDto.Milestone> readMilestones(UUID saveId) {
    return QueryTimer.time(() -> jdbc.sql("""
            select m.id, m.title, m.chapter, sp.completed_at
            from story_milestones m
            left join story_progress sp on sp.milestone_id = m.id and sp.save_id = :saveId
            order by m.sort_order
            """)
        .param("saveId", saveId)
        .query((rs, n) -> new SaveDetailDto.Milestone(rs.getString("id"), rs.getString("title"), rs.getInt("chapter"),
            rs.getObject("completed_at", OffsetDateTime.class)))
        .list()).value();
  }

  private static SaveSummaryDto mapSummary(ResultSet rs, int rowNum) throws SQLException {
    String lastId = rs.getString("last_milestone_id");
    return new SaveSummaryDto(
        rs.getInt("slot"),
        rs.getString("active_character"),
        rs.getInt("current_chapter"),
        lastId == null ? null : new SaveSummaryDto.MilestoneRef(lastId, rs.getString("last_milestone_title")),
        rs.getInt("milestones_completed"),
        rs.getInt("milestones_total"),
        rs.getInt("play_time_sec"),
        rs.getObject("updated_at", OffsetDateTime.class),
        rs.getInt("version"));
  }

  private static SaveRecord mapRecord(ResultSet rs, int rowNum) throws SQLException {
    return new SaveRecord(
        rs.getObject("id", UUID.class),
        rs.getInt("slot"),
        rs.getInt("version"),
        rs.getObject("updated_at", OffsetDateTime.class));
  }
}
