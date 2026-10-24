package mx.utch.tdimp.api.dto;

import java.time.OffsetDateTime;
import java.util.UUID;
import mx.utch.tdimp.api.model.ClientType;

// Una sesión activa (familia de refresh tokens = un inicio de sesión en un dispositivo).
public record DeviceDto(
    UUID id,
    ClientType client,
    String description,
    OffsetDateTime createdAt,
    OffsetDateTime lastUsedAt,
    boolean current) {
}