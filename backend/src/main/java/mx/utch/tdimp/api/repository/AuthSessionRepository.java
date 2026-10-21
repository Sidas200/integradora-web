package mx.utch.tdimp.api.repository;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import mx.utch.tdimp.api.model.AuthSession;
import mx.utch.tdimp.api.model.ClientType;
import mx.utch.tdimp.api.model.RevocationReason;

public interface AuthSessionRepository {

  void insert(UUID id, UUID playerId, UUID familyId, String tokenHash, ClientType client, String userAgent,
              OffsetDateTime authenticatedAt, OffsetDateTime expiresAt);

  // Bloquea la fila: dos refresh simultáneos con el mismo token no pueden rotarlo dos veces.
  Optional<AuthSession> findByTokenHashForUpdate(String tokenHash);

  void markRotated(UUID id, UUID replacedBy, OffsetDateTime at);

  int revokeFamily(UUID familyId, RevocationReason reason, OffsetDateTime at);
}
