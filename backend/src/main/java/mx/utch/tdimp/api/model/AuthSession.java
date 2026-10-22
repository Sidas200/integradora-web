package mx.utch.tdimp.api.model;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AuthSession(
    UUID id,
    UUID playerId,
    UUID familyId,
    ClientType client,
    OffsetDateTime authenticatedAt,
    OffsetDateTime expiresAt,
    OffsetDateTime revokedAt,
    String revocationReason) {

  public boolean isActive(OffsetDateTime now) {
    return revokedAt == null && expiresAt.isAfter(now);
  }
}
