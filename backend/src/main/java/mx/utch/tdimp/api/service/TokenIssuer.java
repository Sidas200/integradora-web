package mx.utch.tdimp.api.service;

import java.time.Instant;
import java.util.UUID;
import mx.utch.tdimp.api.service.AccessClaims;
import mx.utch.tdimp.api.model.ClientType;

public interface TokenIssuer {

  String issueAccessToken(UUID playerId, UUID sessionId, ClientType client, Instant authTime);

  long accessTokenTtlSeconds();

  // Lanza UnauthenticatedException: TOKEN_EXPIRED si venció, INVALID_SESSION si no es válido.
  AccessClaims verify(String accessToken);
}
