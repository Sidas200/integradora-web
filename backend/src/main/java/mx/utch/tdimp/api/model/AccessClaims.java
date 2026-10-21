package mx.utch.tdimp.api.model;

import java.time.Instant;
import java.util.UUID;

// Contenido del access token: sub (jugador), sid (familia de la sesión), cli y auth_time.
public record AccessClaims(UUID playerId, UUID sessionId, ClientType client, Instant authTime) {
}
