package mx.utch.tdimp.api.repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import mx.utch.tdimp.api.config.QueryTimer;
import mx.utch.tdimp.api.model.Player;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
class PlayerRepositoryJdbc implements PlayerRepository {

  private static final Logger log = LoggerFactory.getLogger(PlayerRepositoryJdbc.class);

  private static final String COLUMNS = "id, email, username, password_hash, created_at, last_login_at";

  private final JdbcClient jdbc;

  PlayerRepositoryJdbc(JdbcClient jdbc) {
    this.jdbc = jdbc;
  }

  @Override
  public Optional<Player> findByEmail(String email) {
    var timed = QueryTimer.time(() -> jdbc.sql("select %s from players where email = :email".formatted(COLUMNS))
        .param("email", email)
        .query(PlayerRepositoryJdbc::map)
        .optional());
    log.debug("BD SELECT players (email) -> {} en {} ms", timed.value().isPresent() ? "1 fila" : "0 filas",
        String.format("%.1f", timed.millis()));
    return timed.value();
  }

  @Override
  public Optional<Player> findById(UUID id) {
    var timed = QueryTimer.time(() -> jdbc.sql("select %s from players where id = :id".formatted(COLUMNS))
        .param("id", id)
        .query(PlayerRepositoryJdbc::map)
        .optional());
    log.debug("BD SELECT players (id) -> {} en {} ms", timed.value().isPresent() ? "1 fila" : "0 filas",
        String.format("%.1f", timed.millis()));
    return timed.value();
  }

  @Override
  public boolean emailExists(String email) {
    return QueryTimer.time(() -> jdbc.sql("select exists (select 1 from players where email = :email)")
        .param("email", email)
        .query(Boolean.class)
        .single()).value();
  }

  @Override
  public boolean usernameExists(String username) {
    return QueryTimer.time(() -> jdbc.sql("select exists (select 1 from players where lower(username) = lower(:username))")
        .param("username", username)
        .query(Boolean.class)
        .single()).value();
  }

  @Override
  public Player insert(String email, String username, String passwordHash, OffsetDateTime privacyAcceptedAt) {
    var timed = QueryTimer.time(() -> jdbc.sql("""
            insert into players (email, username, password_hash, privacy_accepted_at)
            values (:email, :username, :passwordHash, :privacyAcceptedAt)
            returning %s
            """.formatted(COLUMNS))
        .param("email", email)
        .param("username", username)
        .param("passwordHash", passwordHash)
        .param("privacyAcceptedAt", privacyAcceptedAt)
        .query(PlayerRepositoryJdbc::map)
        .single());
    log.debug("BD INSERT players -> id={} en {} ms", timed.value().id(), String.format("%.1f", timed.millis()));
    return timed.value();
  }

  @Override
  public void touchLastLogin(UUID id, OffsetDateTime at) {
    QueryTimer.time(() -> jdbc.sql("update players set last_login_at = :at where id = :id")
        .param("at", at)
        .param("id", id)
        .update());
  }

  private static Player map(ResultSet rs, int rowNum) throws SQLException {
    return new Player(
        rs.getObject("id", UUID.class),
        rs.getString("email"),
        rs.getString("username"),
        rs.getString("password_hash"),
        rs.getObject("created_at", OffsetDateTime.class),
        rs.getObject("last_login_at", OffsetDateTime.class));
  }
}
