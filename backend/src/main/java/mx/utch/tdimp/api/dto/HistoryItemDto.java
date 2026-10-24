package mx.utch.tdimp.api.dto;

import java.time.OffsetDateTime;

public record HistoryItemDto(
    String type,
    String referenceId,
    OffsetDateTime occurredAt,
    Integer slot,
    String title,
    Integer valueSec) {
}
