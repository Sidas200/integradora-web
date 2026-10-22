package mx.utch.tdimp.api.repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import mx.utch.tdimp.api.config.QueryTimer;
import mx.utch.tdimp.api.model.AccountSummary;
import mx.utch.tdimp.api.model.HistoryItem;
import mx.utch.tdimp.api.model.PlaySession;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

// Lee las vistas v_player_summary y v_player_history (read models de la PWA).
@Repository
class HistoryReaderJdbc implements HistoryReader {

  private final JdbcClient jdbc;

  HistoryReaderJdbc(JdbcClient jdbc) {
    this.jdbc = jdbc;
  }

  @Override
  public AccountSummary summary(UUID playerId) {
    return QueryTimer.time(() -> jdbc.sql("""
            select saves, play_time_sec, enemies_defeated, items_crafted, achievements_unlocked, achievements_total,
                   last_session_at
            from v_player_summary where player_id = :playerId
            """)
        .param("playerId", playerId)
        .query((rs, n) -> new AccountSummary(rs.getInt("saves"), rs.getLong("play_time_sec"),
            rs.getLong("enemies_defeated"), rs.getLong("items_crafted"), rs.getInt("achievements_unlocked"),
            rs.getInt("achievements_total"), rs.getObject("last_session_at", OffsetDateTime.class)))
        .single()).value();
  }

  @Override
  public List<PlaySession> sessions(UUID playerId, Integer slot, int limit, long offset) {
    return QueryTimer.time(() -> jdbc.sql("""
            select s.id, sa.slot, s.started_at, s.ended_at, s.duration_sec, s.platform, s.game_version
            from play_sessions s join saves sa on sa.id = s.save_id
            where sa.player_id = :playerId and (cast(:slot as smallint) is null or sa.slot = :slot)
            order by s.started_at desc, s.id
            limit :limit offset :offset
            """)
        .param("playerId", playerId)
        .param("slot", slot)
        .param("limit", limit)
        .param("offset", offset)
        .query((rs, n) -> new PlaySession(rs.getObject("id", UUID.class), rs.getInt("slot"),
            rs.getObject("started_at", OffsetDateTime.class), rs.getObject("ended_at", OffsetDateTime.class),
            rs.getObject("duration_sec", Integer.class), rs.getString("platform"), rs.getString("game_version")))
        .list()).value();
  }

  @Override
  public long countSessions(UUID playerId, Integer slot) {
    return QueryTimer.time(() -> jdbc.sql("""
            select count(*) from play_sessions s join saves sa on sa.id = s.save_id
            where sa.player_id = :playerId and (cast(:slot as smallint) is null or sa.slot = :slot)
            """)
        .param("playerId", playerId)
        .param("slot", slot)
        .query(Long.class)
        .single()).value();
  }

  @Override
  public List<HistoryItem> history(UUID playerId, String type, int limit, long offset) {
    return QueryTimer.time(() -> jdbc.sql("""
            select type, reference_id, occurred_at, slot, title, value_sec
            from v_player_history
            where player_id = :playerId and (cast(:type as text) is null or type = :type)
            order by occurred_at desc, reference_id
            limit :limit offset :offset
            """)
        .param("playerId", playerId)
        .param("type", type)
        .param("limit", limit)
        .param("offset", offset)
        .query((rs, n) -> new HistoryItem(rs.getString("type"), rs.getString("reference_id"),
            rs.getObject("occurred_at", OffsetDateTime.class), rs.getObject("slot", Integer.class),
            rs.getString("title"), rs.getObject("value_sec", Integer.class)))
        .list()).value();
  }

  @Override
  public long countHistory(UUID playerId, String type) {
    return QueryTimer.time(() -> jdbc.sql("""
            select count(*) from v_player_history
            where player_id = :playerId and (cast(:type as text) is null or type = :type)
            """)
        .param("playerId", playerId)
        .param("type", type)
        .query(Long.class)
        .single()).value();
  }
}
