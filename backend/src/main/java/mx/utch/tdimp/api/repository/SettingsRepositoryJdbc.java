package mx.utch.tdimp.api.repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import mx.utch.tdimp.api.config.QueryTimer;
import mx.utch.tdimp.api.model.Settings;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

@Repository
class SettingsRepositoryJdbc implements SettingsRepository {

  private static final TypeReference<Map<String, String>> CONTROLS = new TypeReference<>() { };
  private static final String COLUMNS = "music_volume, sfx_volume, language, fullscreen, controls::text as controls, updated_at";

  private final JdbcClient jdbc;
  private final JsonMapper json;

  SettingsRepositoryJdbc(JdbcClient jdbc, JsonMapper json) {
    this.jdbc = jdbc;
    this.json = json;
  }

  @Override
  public void insertDefaults(UUID playerId) {
    QueryTimer.time(() -> jdbc.sql("insert into settings (player_id) values (:playerId) on conflict do nothing")
        .param("playerId", playerId)
        .update());
  }

  @Override
  public Optional<Settings> find(UUID playerId) {
    return QueryTimer.time(() -> jdbc.sql("select %s from settings where player_id = :playerId".formatted(COLUMNS))
        .param("playerId", playerId)
        .query(this::map)
        .optional()).value();
  }

  @Override
  public Settings upsert(UUID playerId, Settings s) {
    return QueryTimer.time(() -> jdbc.sql("""
            insert into settings (player_id, music_volume, sfx_volume, language, fullscreen, controls)
            values (:playerId, :music, :sfx, :language, :fullscreen, cast(:controls as jsonb))
            on conflict (player_id) do update
              set music_volume = excluded.music_volume, sfx_volume = excluded.sfx_volume,
                  language = excluded.language, fullscreen = excluded.fullscreen, controls = excluded.controls
            returning %s
            """.formatted(COLUMNS))
        .param("playerId", playerId)
        .param("music", s.musicVolume())
        .param("sfx", s.sfxVolume())
        .param("language", s.language())
        .param("fullscreen", s.fullscreen())
        .param("controls", json.writeValueAsString(s.controls()))
        .query(this::map)
        .single()).value();
  }

  private Settings map(ResultSet rs, int rowNum) throws SQLException {
    return new Settings(
        rs.getInt("music_volume"),
        rs.getInt("sfx_volume"),
        rs.getString("language"),
        rs.getBoolean("fullscreen"),
        json.readValue(rs.getString("controls"), CONTROLS),
        rs.getObject("updated_at", OffsetDateTime.class));
  }
}
