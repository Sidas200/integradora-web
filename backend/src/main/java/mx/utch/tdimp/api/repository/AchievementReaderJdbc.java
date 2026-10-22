package mx.utch.tdimp.api.repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import mx.utch.tdimp.api.config.QueryTimer;
import mx.utch.tdimp.api.model.Achievement;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
class AchievementReaderJdbc implements AchievementReader {

  private static final Logger log = LoggerFactory.getLogger(AchievementReaderJdbc.class);

  private final JdbcClient jdbc;

  AchievementReaderJdbc(JdbcClient jdbc) {
    this.jdbc = jdbc;
  }

  @Override
  public List<Achievement> findAllOrdered() {
    var timed = QueryTimer.time(() -> jdbc.sql("""
            select id, name, description, icon_key, hidden, sort_order
            from achievements
            order by sort_order, id
            """)
        .query(AchievementReaderJdbc::map)
        .list());
    log.debug("BD SELECT achievements -> {} filas en {} ms", timed.value().size(), String.format("%.1f", timed.millis()));
    return timed.value();
  }

  private static Achievement map(ResultSet rs, int rowNum) throws SQLException {
    return new Achievement(
        rs.getString("id"),
        rs.getString("name"),
        rs.getString("description"),
        rs.getString("icon_key"),
        rs.getBoolean("hidden"),
        rs.getInt("sort_order"));
  }
}