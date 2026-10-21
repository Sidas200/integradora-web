package mx.utch.tdimp.api.dto;

import java.time.OffsetDateTime;
import java.util.List;

// SaveSummary + stats, inventario con datos del catálogo y todos los hitos (completedAt null = pendiente).
public record SaveDetailDto(
    int slot,
    String activeCharacter,
    int currentChapter,
    SaveSummaryDto.MilestoneRef lastMilestone,
    int milestonesCompleted,
    int milestonesTotal,
    int playTimeSec,
    OffsetDateTime updatedAt,
    int version,
    SaveStatsDto stats,
    List<Item> inventory,
    List<Milestone> milestones) {

  public record Item(String itemId, String name, String type, String rarity, String iconKey, int quantity) {
  }

  public record Milestone(String id, String title, int chapter, OffsetDateTime completedAt) {
  }
}
