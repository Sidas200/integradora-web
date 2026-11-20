package mx.utch.tdimp.api.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import mx.utch.tdimp.api.dto.EventInput;
import mx.utch.tdimp.api.dto.PlaySessionInput;
import mx.utch.tdimp.api.dto.SaveDataDto;
import mx.utch.tdimp.api.dto.SaveStatsDto;
import mx.utch.tdimp.api.model.GameEvent;
import mx.utch.tdimp.api.model.InventoryItem;
import mx.utch.tdimp.api.model.MilestoneStatus;
import mx.utch.tdimp.api.model.PlaySession;
import mx.utch.tdimp.api.model.SaveContent;
import mx.utch.tdimp.api.model.SaveStats;
import mx.utch.tdimp.api.model.SaveSummary;
import org.junit.jupiter.api.Test;

/** Unit tests of SaveMapper: the save document must survive the trip contract → model → contract unchanged. */
class SaveMapperTest {

  private static final OffsetDateTime AT = OffsetDateTime.of(2026, 11, 9, 18, 0, 0, 0, ZoneOffset.UTC);

  static SaveDataDto fullDocument() {
    return new SaveDataDto(
        7, "HIKARI", 1, "Zone1_Forest",
        new SaveDataDto.Position(12.5, -3.25),
        80,
        new SaveStatsDto(6720, 61, 3, 40, 2),
        List.of(new SaveDataDto.InventoryEntry("flor_destello", 5), new SaveDataDto.InventoryEntry("resto_slime", 2)),
        List.of("zone1:pickup_01", "zone1:pickup_02"),
        List.of(new SaveDataDto.ObjectState("zone1:chest_01", "OPENED")),
        List.of(new SaveDataDto.CompletedMilestone("woke_up", 300, AT.minusHours(2)),
            new SaveDataDto.CompletedMilestone("has_sword", null, AT.minusHours(1))),
        Map.of("v", 1, "difficulty", "normal"));
  }

  @Test
  void theWholeDocumentSurvivesTheRoundTrip() {
    SaveDataDto original = fullDocument();

    SaveContent model = SaveMapper.toModel(original);
    SaveDataDto back = SaveMapper.toDto(model);

    assertThat(back).isEqualTo(original);
    assertThat(model.position().x()).isEqualTo(12.5);
    assertThat(model.inventory()).extracting(SaveContent.InventoryEntry::itemId).containsExactly("flor_destello", "resto_slime");
    assertThat(model.completedMilestones().get(1).playTimeSec()).isNull();
  }

  @Test
  void aDocumentWithoutPositionOrHealthKeepsThemEmpty() {
    SaveDataDto withoutPosition = new SaveDataDto(0, "TSUKI", 0, null, null, null,
        new SaveStatsDto(0, 0, 0, 0, 0), List.of(), List.of(), List.of(), List.of(), Map.of("v", 1));

    SaveContent model = SaveMapper.toModel(withoutPosition);

    assertThat(model.position()).isNull();
    assertThat(model.health()).isNull();
    assertThat(model.currentScene()).isNull();
    assertThat(SaveMapper.toDto(model)).isEqualTo(withoutPosition);
  }

  @Test
  void theCollectedPickupsAreACopyOfTheReceivedList() {
    var pickups = new ArrayList<>(List.of("zone1:pickup_01"));
    SaveDataDto dto = new SaveDataDto(0, "TSUKI", 0, null, null, null, new SaveStatsDto(0, 0, 0, 0, 0),
        List.of(), pickups, List.of(), List.of(), Map.of("v", 1));

    SaveContent model = SaveMapper.toModel(dto);
    pickups.add("zone1:pickup_99");

    assertThat(model.collectedPickups()).containsExactly("zone1:pickup_01");
  }

  @Test
  void statsAreCopiedFieldByField() {
    SaveStats stats = SaveMapper.toModel(new SaveStatsDto(100, 2, 3, 4, 5));

    assertThat(stats).isEqualTo(new SaveStats(100, 2, 3, 4, 5));
    assertThat(SaveMapper.toDto(stats)).isEqualTo(new SaveStatsDto(100, 2, 3, 4, 5));
  }

  @Test
  void theSummaryHasNoLastMilestoneBeforeTheFirstOne() {
    var empty = new SaveSummary(2, "TSUKI", 0, null, 0, 11, 0, AT, 1);
    var progressed = new SaveSummary(1, "HIKARI", 1, new SaveSummary.MilestoneRef("has_sword", "La espada carmesí"),
        2, 11, 6720, AT, 7);

    assertThat(SaveMapper.toDto(empty).lastMilestone()).isNull();
    var dto = SaveMapper.toDto(progressed);
    assertThat(dto.lastMilestone().id()).isEqualTo("has_sword");
    assertThat(dto.lastMilestone().title()).isEqualTo("La espada carmesí");
    assertThat(dto.slot()).isEqualTo(1);
    assertThat(dto.milestonesCompleted()).isEqualTo(2);
    assertThat(dto.milestonesTotal()).isEqualTo(11);
    assertThat(dto.playTimeSec()).isEqualTo(6720);
    assertThat(dto.version()).isEqualTo(7);
  }

  @Test
  void theDetailJoinsStatsCatalogItemsAndEveryMilestone() {
    var summary = new SaveSummary(1, "TSUKI", 1, new SaveSummary.MilestoneRef("woke_up", "El despertar"), 1, 2, 300, AT, 3);

    var detail = SaveMapper.toDetail(summary, new SaveStats(300, 4, 0, 6, 0),
        List.of(new InventoryItem("flor_destello", "Flor destello", "MATERIAL", "COMMON", "flor_destello", 5)),
        List.of(new MilestoneStatus("woke_up", "El despertar", 0, AT), new MilestoneStatus("has_sword", "La espada carmesí", 0, null)));

    assertThat(detail.version()).isEqualTo(3);
    assertThat(detail.stats().enemiesDefeated()).isEqualTo(4);
    assertThat(detail.inventory()).singleElement().satisfies(item -> {
      assertThat(item.name()).isEqualTo("Flor destello");
      assertThat(item.rarity()).isEqualTo("COMMON");
      assertThat(item.quantity()).isEqualTo(5);
    });
    assertThat(detail.milestones()).extracting(m -> m.completedAt()).containsExactly(AT, null);
  }

  @Test
  void sessionsAndEventsKeepTheIdGeneratedByTheGame() {
    UUID sessionId = UUID.randomUUID();
    UUID eventId = UUID.randomUUID();

    PlaySession session = SaveMapper.toModel(
        new PlaySessionInput(sessionId, AT.minusMinutes(30), AT, 1680, "WINDOWS", "1.0.0"));
    GameEvent event = SaveMapper.toModel(new EventInput(eventId, "DEATH", Map.of("scene", "Zone1_Forest"), AT));

    assertThat(session.id()).isEqualTo(sessionId);
    assertThat(session.slot()).isZero(); // filled in only when read from the database
    assertThat(session.durationSec()).isEqualTo(1680);
    assertThat(session.platform()).isEqualTo("WINDOWS");
    assertThat(event.id()).isEqualTo(eventId);
    assertThat(event.data()).containsEntry("scene", "Zone1_Forest");
  }
}