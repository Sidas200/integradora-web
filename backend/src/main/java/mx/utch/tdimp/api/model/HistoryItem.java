package mx.utch.tdimp.api.model;

import java.time.OffsetDateTime;

/** Row of the v_player_history view: SESSION, ACHIEVEMENT or MILESTONE. */
public record HistoryItem(
    String type,
    String referenceId,
    OffsetDateTime occurredAt,
    Integer slot,
    String title,
    Integer valueSec) {
}
