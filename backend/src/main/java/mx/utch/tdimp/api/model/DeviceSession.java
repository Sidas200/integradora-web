package mx.utch.tdimp.api.model;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * La sesión vigente de una familia de refresh tokens: un inicio de sesión en un dispositivo.
 * authenticatedAt = cuando se escribió la contraseña; lastUsedAt = la última renovación del token.
 */
public record DeviceSession(
    UUID familyId,
    ClientType client,
    String userAgent,
    OffsetDateTime authenticatedAt,
    OffsetDateTime lastUsedAt) {
}