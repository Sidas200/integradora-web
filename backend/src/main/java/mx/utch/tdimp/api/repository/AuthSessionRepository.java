package mx.utch.tdimp.api.repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import mx.utch.tdimp.api.model.AuthSession;
import mx.utch.tdimp.api.model.ClientType;
import mx.utch.tdimp.api.model.DeviceSession;
import mx.utch.tdimp.api.model.RevocationReason;

public interface AuthSessionRepository {

  void insert(UUID id, UUID playerId, UUID familyId, String tokenHash, ClientType client, String userAgent,
              OffsetDateTime authenticatedAt, OffsetDateTime expiresAt);

  // Bloquea la fila: dos refresh simultáneos con el mismo token no pueden rotarlo dos veces.
  Optional<AuthSession> findByTokenHashForUpdate(String tokenHash);

  void markRotated(UUID id, UUID replacedBy, OffsetDateTime at);

  int revokeFamily(UUID familyId, RevocationReason reason, OffsetDateTime at);

  // Las familias del jugador que siguen vivas (una fila sin revocar y sin vencer por familia), la más reciente primero.
  List<DeviceSession> activeFamilies(UUID playerId, OffsetDateTime now);

  boolean familyActive(UUID playerId, UUID familyId, OffsetDateTime now);

  // Solo revoca si la familia es de ese jugador: un id ajeno da 0 filas (404), nunca revoca la sesión de otro.
  int revokePlayerFamily(UUID playerId, UUID familyId, RevocationReason reason, OffsetDateTime at);

  // Todas las familias activas del jugador menos la indicada (el dispositivo que hace la petición).
  int revokeOtherFamilies(UUID playerId, UUID keepFamilyId, RevocationReason reason, OffsetDateTime at);
}