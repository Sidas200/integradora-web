package mx.utch.tdimp.api.model;

import java.time.OffsetDateTime;

public record NewsPost(
    String slug,
    String title,
    String summary,
    String contentMd,
    String coverKey,
    OffsetDateTime publishedAt) {
}
