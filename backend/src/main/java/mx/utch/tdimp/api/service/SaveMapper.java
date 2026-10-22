package mx.utch.tdimp.api.service;

import java.util.List;
import mx.utch.tdimp.api.dto.EventInput;
import mx.utch.tdimp.api.dto.PlaySessionInput;
import mx.utch.tdimp.api.dto.SaveDataDto;
import mx.utch.tdimp.api.dto.SaveDetailDto;
import mx.utch.tdimp.api.dto.SaveStatsDto;
import mx.utch.tdimp.api.dto.SaveSummaryDto;
import mx.utch.tdimp.api.model.GameEvent;
import mx.utch.tdimp.api.model.InventoryItem;
import mx.utch.tdimp.api.model.MilestoneStatus;
import mx.utch.tdimp.api.model.PlaySession;
import mx.utch.tdimp.api.model.SaveContent;
import mx.utch.tdimp.api.model.SaveStats;
import mx.utch.tdimp.api.model.SaveSummary;

// Traduce entre el contrato (dto) y el modelo que usan los repositorios.
final class SaveMapper {

  private SaveMapper() {
  }

  static SaveContent toModel(SaveDataDto d) {
    return new SaveContent(
        d.version(),
        d.activeCharacter(),
        d.currentChapter(),
        d.currentScene(),
        d.position() == null ? null : new SaveContent.Position(d.position().x(), d.position().y()),
        d.health(),
        toModel(d.stats()),
        d.inventory().stream().map(i -> new SaveContent.InventoryEntry(i.itemId(), i.quantity())).toList(),
        List.copyOf(d.collectedPickups()),
        d.objects().stream().map(o -> new SaveContent.ObjectState(o.objectId(), o.state())).toList(),
        d.completedMilestones().stream()
            .map(m -> new SaveContent.CompletedMilestone(m.milestoneId(), m.playTimeSec(), m.completedAt()))
            .toList(),
        d.extraData());
  }

  static SaveDataDto toDto(SaveContent c) {
    return new SaveDataDto(
        c.version(),
        c.activeCharacter(),
        c.currentChapter(),
        c.currentScene(),
        c.position() == null ? null : new SaveDataDto.Position(c.position().x(), c.position().y()),
        c.health(),
        toDto(c.stats()),
        c.inventory().stream().map(i -> new SaveDataDto.InventoryEntry(i.itemId(), i.quantity())).toList(),
        c.collectedPickups(),
        c.objects().stream().map(o -> new SaveDataDto.ObjectState(o.objectId(), o.state())).toList(),
        c.completedMilestones().stream()
            .map(m -> new SaveDataDto.CompletedMilestone(m.milestoneId(), m.playTimeSec(), m.completedAt()))
            .toList(),
        c.extraData());
  }

  static SaveStats toModel(SaveStatsDto s) {
    return new SaveStats(s.playTimeSec(), s.enemiesDefeated(), s.deaths(), s.materialsCollected(), s.itemsCrafted());
  }

  static SaveStatsDto toDto(SaveStats s) {
    return new SaveStatsDto(s.playTimeSec(), s.enemiesDefeated(), s.deaths(), s.materialsCollected(), s.itemsCrafted());
  }

  static SaveSummaryDto toDto(SaveSummary s) {
    return new SaveSummaryDto(s.slot(), s.activeCharacter(), s.currentChapter(), milestoneRef(s), s.milestonesCompleted(),
        s.milestonesTotal(), s.playTimeSec(), s.updatedAt(), s.version());
  }

  static SaveDetailDto toDetail(SaveSummary s, SaveStats stats, List<InventoryItem> inventory,
                                List<MilestoneStatus> milestones) {
    return new SaveDetailDto(s.slot(), s.activeCharacter(), s.currentChapter(), milestoneRef(s), s.milestonesCompleted(),
        s.milestonesTotal(), s.playTimeSec(), s.updatedAt(), s.version(), toDto(stats),
        inventory.stream()
            .map(i -> new SaveDetailDto.Item(i.itemId(), i.name(), i.type(), i.rarity(), i.iconKey(), i.quantity()))
            .toList(),
        milestones.stream()
            .map(m -> new SaveDetailDto.Milestone(m.id(), m.title(), m.chapter(), m.completedAt()))
            .toList());
  }

  static PlaySession toModel(PlaySessionInput s) {
    return new PlaySession(s.id(), 0, s.startedAt(), s.endedAt(), s.durationSec(), s.platform(), s.gameVersion());
  }

  static GameEvent toModel(EventInput e) {
    return new GameEvent(e.id(), e.type(), e.data(), e.occurredAt());
  }

  private static SaveSummaryDto.MilestoneRef milestoneRef(SaveSummary s) {
    var last = s.lastMilestone();
    return last == null ? null : new SaveSummaryDto.MilestoneRef(last.id(), last.title());
  }
}
