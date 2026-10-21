package mx.utch.tdimp.api.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AccountDto(
    UUID id,
    String username,
    String email,
    OffsetDateTime createdAt,
    OffsetDateTime lastLoginAt,
    AccountSummaryDto summary) {
}
