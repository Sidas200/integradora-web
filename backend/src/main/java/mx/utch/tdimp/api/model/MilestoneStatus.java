package mx.utch.tdimp.api.model;

import java.time.OffsetDateTime;

/** A story milestone of the catalog for one slot. completedAt is null while pending. */
public record MilestoneStatus(String id, String title, int chapter, OffsetDateTime completedAt) {
}
