package mx.utch.tdimp.api.model;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * A play session of one save slot. The id comes from the game, so sending the same
 * session again does not duplicate it. slot is 0 while it is not read from the database.
 */
public record PlaySession(
    UUID id,
    int slot,
    OffsetDateTime startedAt,
    OffsetDateTime endedAt,
    Integer durationSec,
    String platform,
    String gameVersion) {
}
