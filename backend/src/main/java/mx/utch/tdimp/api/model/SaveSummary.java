package mx.utch.tdimp.api.model;

import java.time.OffsetDateTime;

/** What the web shows of a save slot without opening it. lastMilestone is null before the first one. */
public record SaveSummary(
    int slot,
    String activeCharacter,
    int currentChapter,
    MilestoneRef lastMilestone,
    int milestonesCompleted,
    int milestonesTotal,
    int playTimeSec,
    OffsetDateTime updatedAt,
    int version) {

  public record MilestoneRef(String id, String title) {
  }
}
