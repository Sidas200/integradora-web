package mx.utch.tdimp.api.dto;

import java.time.OffsetDateTime;

public record NewsPostDto(
    String slug,
    String title,
    String summary,
    String coverKey,
    OffsetDateTime publishedAt,
    String contentMd) {
}
