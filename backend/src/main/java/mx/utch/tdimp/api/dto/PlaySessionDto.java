package mx.utch.tdimp.api.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record PlaySessionDto(
    UUID id,
    int slot,
    OffsetDateTime startedAt,
    OffsetDateTime endedAt,
    Integer durationSec,
    String platform) {
}
