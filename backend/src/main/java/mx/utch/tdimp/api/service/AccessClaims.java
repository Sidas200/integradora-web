package mx.utch.tdimp.api.service;

import java.time.Instant;
import java.util.UUID;
import mx.utch.tdimp.api.model.ClientType;

// Contenido del access token: sub (jugador), sid (familia de la sesión), cli y auth_time.
public record AccessClaims(UUID playerId, UUID sessionId, ClientType client, Instant authTime) {
}
