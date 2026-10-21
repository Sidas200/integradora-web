package mx.utch.tdimp.api.model;

import java.time.OffsetDateTime;
import java.util.UUID;

public record Player(
    UUID id,
    String email,
    String username,
    String passwordHash,
    OffsetDateTime createdAt,
    OffsetDateTime lastLoginAt) {
}
