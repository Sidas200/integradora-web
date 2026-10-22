package mx.utch.tdimp.api.dto;

import java.time.OffsetDateTime;

public record SaveAcceptedDto(int version, OffsetDateTime updatedAt) {
}
