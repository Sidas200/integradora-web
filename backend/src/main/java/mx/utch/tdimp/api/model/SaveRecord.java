package mx.utch.tdimp.api.model;

import java.time.OffsetDateTime;
import java.util.UUID;

public record SaveRecord(UUID id, int slot, int version, OffsetDateTime updatedAt) {
}
