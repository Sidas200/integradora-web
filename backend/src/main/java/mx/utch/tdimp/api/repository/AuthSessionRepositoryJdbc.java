package mx.utch.tdimp.api.repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import mx.utch.tdimp.api.config.QueryTimer;
import mx.utch.tdimp.api.model.AuthSession;
import mx.utch.tdimp.api.model.ClientType;
import mx.utch.tdimp.api.model.RevocationReason;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
class AuthSessionRepositoryJdbc implements AuthSessionRepository {

  private static final Logger log = LoggerFactory.getLogger(AuthSessionRepositoryJdbc.class);

  private final JdbcClient jdbc;

  AuthSessionRepositoryJdbc(JdbcClient jdbc) {
    this.jdbc = jdbc;
  }

  @Override
  public void insert(UUID id, UUID playerId, UUID familyId, String tokenHash, ClientType client, String userAgent,
                     OffsetDateTime authenticatedAt, OffsetDateTime expiresAt) {
    var timed = QueryTimer.time(() -> jdbc.sql("""
            insert into auth_sessions (id, player_id, family_id, token_hash, client, user_agent, authenticated_at, expires_at)
            values (:id, :playerId, :familyId, :tokenHash, :client, :userAgent, :authenticatedAt, :expiresAt)
            """)
        .param("id", id)
        .param("playerId", playerId)
        .param("familyId", familyId)
        .param("tokenHash", tokenHash)
        .param("client", client.name())
        .param("userAgent", userAgent)
        .param("authenticatedAt", authenticatedAt)
        .param("expiresAt", expiresAt)
        .update());
    log.debug("BD INSERT auth_sessions (familia={}, cliente={}) en {} ms", familyId, client,
        String.format("%.1f", timed.millis()));
  }

  @Override
  public Optional<AuthSession> findByTokenHashForUpdate(String tokenHash) {
    return QueryTimer.time(() -> jdbc.sql("""
            select id, player_id, family_id, client, authenticated_at, expires_at, revoked_at, revocation_reason
            from auth_sessions
            where token_hash = :tokenHash
            for update
            """)
        .param("tokenHash", tokenHash)
        .query(AuthSessionRepositoryJdbc::map)
        .optional()).value();
  }

  @Override
  public void markRotated(UUID id, UUID replacedBy, OffsetDateTime at) {
    QueryTimer.time(() -> jdbc.sql("""
            update auth_sessions
            set revoked_at = :at, revocation_reason = 'ROTATED', replaced_by = :replacedBy, last_used_at = :at
            where id = :id
            """)
        .param("at", at)
        .param("replacedBy", replacedBy)
        .param("id", id)
        .update());
  }

  @Override
  public int revokeFamily(UUID familyId, RevocationReason reason, OffsetDateTime at) {
    var timed = QueryTimer.time(() -> jdbc.sql("""
            update auth_sessions
            set revoked_at = :at, revocation_reason = :reason
            where family_id = :familyId and revoked_at is null
            """)
        .param("at", at)
        .param("reason", reason.name())
        .param("familyId", familyId)
        .update());
    log.debug("BD UPDATE auth_sessions revocar familia={} ({}) -> filas={}", familyId, reason, timed.value());
    return timed.value();
  }

  private static AuthSession map(ResultSet rs, int rowNum) throws SQLException {
    return new AuthSession(
        rs.getObject("id", UUID.class),
        rs.getObject("player_id", UUID.class),
        rs.getObject("family_id", UUID.class),
        ClientType.valueOf(rs.getString("client")),
        rs.getObject("authenticated_at", OffsetDateTime.class),
        rs.getObject("expires_at", OffsetDateTime.class),
        rs.getObject("revoked_at", OffsetDateTime.class),
        rs.getString("revocation_reason"));
  }
}
