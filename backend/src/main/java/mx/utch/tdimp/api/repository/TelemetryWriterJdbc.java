package mx.utch.tdimp.api.repository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import mx.utch.tdimp.api.config.QueryTimer;
import mx.utch.tdimp.api.model.GameEvent;
import mx.utch.tdimp.api.model.PlaySession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.json.JsonMapper;

@Repository
class TelemetryWriterJdbc implements TelemetryWriter {

  private static final Logger log = LoggerFactory.getLogger(TelemetryWriterJdbc.class);

  private final JdbcClient jdbc;
  private final JsonMapper json;

  TelemetryWriterJdbc(JdbcClient jdbc, JsonMapper json) {
    this.jdbc = jdbc;
    this.json = json;
  }

  @Override
  public int insertSessions(UUID saveId, List<PlaySession> sessions) {
    List<Map<String, Object>> rows = sessions.stream().map(s -> {
      Map<String, Object> row = new HashMap<>();
      row.put("id", s.id().toString());
      row.put("started_at", s.startedAt().toString());
      row.put("ended_at", s.endedAt().toString());
      row.put("duration_sec", s.durationSec());
      row.put("platform", s.platform());
      row.put("game_version", s.gameVersion());
      return row;
    }).toList();
    var timed = QueryTimer.time(() -> jdbc.sql("""
            insert into play_sessions (id, save_id, started_at, ended_at, duration_sec, platform, game_version)
            select x.id, :saveId, x.started_at, x.ended_at, x.duration_sec, x.platform, x.game_version
            from jsonb_to_recordset(cast(:rows as jsonb))
                 as x(id uuid, started_at timestamptz, ended_at timestamptz, duration_sec int, platform text, game_version text)
            on conflict (id) do nothing
            """)
        .param("saveId", saveId)
        .param("rows", json.writeValueAsString(rows))
        .update());
    log.debug("BD INSERT play_sessions -> {} nuevas de {} en {} ms", timed.value(), sessions.size(),
        String.format("%.1f", timed.millis()));
    return timed.value();
  }

  @Override
  public int insertEvents(UUID saveId, List<GameEvent> events) {
    List<Map<String, Object>> rows = events.stream().map(e -> {
      Map<String, Object> row = new HashMap<>();
      row.put("id", e.id().toString());
      row.put("type", e.type());
      row.put("data", e.data() == null ? Map.of() : e.data());
      row.put("occurred_at", e.occurredAt().toString());
      return row;
    }).toList();
    var timed = QueryTimer.time(() -> jdbc.sql("""
            insert into telemetry_events (id, save_id, type, data, occurred_at)
            select x.id, :saveId, x.type, x.data, x.occurred_at
            from jsonb_to_recordset(cast(:rows as jsonb)) as x(id uuid, type text, data jsonb, occurred_at timestamptz)
            on conflict (id) do nothing
            """)
        .param("saveId", saveId)
        .param("rows", json.writeValueAsString(rows))
        .update());
    log.debug("BD INSERT telemetry_events -> {} nuevos de {} en {} ms", timed.value(), events.size(),
        String.format("%.1f", timed.millis()));
    return timed.value();
  }
}
