package mx.utch.tdimp.api.model;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

/**
 * Whole document of a save slot as Unity writes and reads it. The repository spreads it
 * over saves, save_stats, inventory, collected_pickups, interacted_objects and story_progress.
 */
public record SaveContent(
    int version,
    String activeCharacter,
    int currentChapter,
    String currentScene,
    Position position,
    Integer health,
    SaveStats stats,
    List<InventoryEntry> inventory,
    List<String> collectedPickups,
    List<ObjectState> objects,
    List<CompletedMilestone> completedMilestones,
    Map<String, Object> extraData) {

  public record Position(double x, double y) {
  }

  public record InventoryEntry(String itemId, int quantity) {
  }

  public record ObjectState(String objectId, String state) {
  }

  public record CompletedMilestone(String milestoneId, Integer playTimeSec, OffsetDateTime completedAt) {
  }
}
