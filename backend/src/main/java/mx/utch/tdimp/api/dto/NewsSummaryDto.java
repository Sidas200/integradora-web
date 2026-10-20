package mx.utch.tdimp.api.dto;

import java.time.OffsetDateTime;

public record NewsSummaryDto(
    String slug,
    String title,
    String summary,
    String coverKey,
    OffsetDateTime publishedAt) {
}
