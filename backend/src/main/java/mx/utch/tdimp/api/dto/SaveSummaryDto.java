package mx.utch.tdimp.api.dto;

import java.time.OffsetDateTime;

public record SaveSummaryDto(
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
