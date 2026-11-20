package mx.utch.tdimp.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import mx.utch.tdimp.api.dto.BatchResultDto;
import mx.utch.tdimp.api.dto.EventInput;
import mx.utch.tdimp.api.dto.PlaySessionInput;
import mx.utch.tdimp.api.dto.SaveAcceptedDto;
import mx.utch.tdimp.api.dto.SaveDataDto;
import mx.utch.tdimp.api.dto.SaveStatsDto;
import mx.utch.tdimp.api.exception.InvalidParameterException;
import mx.utch.tdimp.api.exception.NotFoundException;
import mx.utch.tdimp.api.exception.VersionConflictException;
import mx.utch.tdimp.api.model.GameEvent;
import mx.utch.tdimp.api.model.InventoryItem;
import mx.utch.tdimp.api.model.MilestoneStatus;
import mx.utch.tdimp.api.model.PlaySession;
import mx.utch.tdimp.api.model.SaveContent;
import mx.utch.tdimp.api.model.SaveRecord;
import mx.utch.tdimp.api.model.SaveStats;
import mx.utch.tdimp.api.model.SaveSummary;
import mx.utch.tdimp.api.repository.CatalogReader;
import mx.utch.tdimp.api.repository.SaveRepository;
import mx.utch.tdimp.api.repository.TelemetryWriter;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

/**
 * Unit tests of SaveServiceImpl: cloud saves with optimistic versioning, catalog checks
 * and the telemetry batches. Repositories are Mockito doubles.
 */
class SaveServiceImplTest {

  private static final OffsetDateTime AT = OffsetDateTime.of(2026, 11, 9, 18, 0, 0, 0, ZoneOffset.UTC);
  private static final UUID PLAYER = UUID.fromString("11111111-1111-1111-1111-111111111111");
  private static final UUID SAVE_ID = UUID.fromString("44444444-4444-4444-4444-444444444444");

  private final SaveRepository saves = mock(SaveRepository.class);
  private final CatalogReader catalog = mock(CatalogReader.class);
  private final TelemetryWriter telemetry = mock(TelemetryWriter.class);
  private final SaveService service = new SaveServiceImpl(saves, catalog, telemetry);

  // --------------------------------------------------------------- helpers

  private static SaveDataDto document(int version) {
    return document(version, List.of(new SaveDataDto.InventoryEntry("flor_destello", 5)), Map.of("v", 1));
  }

  private static SaveDataDto document(int version, List<SaveDataDto.InventoryEntry> inventory, Map<String, Object> extra) {
    return new SaveDataDto(version, "TSUKI", 1, "Zone1_Forest", new SaveDataDto.Position(1.0, 2.0), 100,
        new SaveStatsDto(600, 5, 1, 7, 0), inventory, List.of("zone1:pickup_01"), List.of(),
        List.of(new SaveDataDto.CompletedMilestone("woke_up", 60, AT)), extra);
  }

  private static <T extends Throwable> T thrown(Class<T> type, ThrowingCallable call) {
    Throwable thrown = catchThrowable(call);
    assertThat(thrown).isInstanceOf(type);
    return type.cast(thrown);
  }

  private void verifyNothingWritten() {
    verify(saves, never()).insert(any(), anyInt(), any());
    verify(saves, never()).update(any(), any());
    verify(saves, never()).replaceContents(any(), any());
  }

  // ---------------------------------------------------------------- upload

  @Test
  void theFirstUploadCreatesTheSlotAtVersionOne() {
    when(saves.findForUpdate(PLAYER, 1)).thenReturn(Optional.empty());
    when(saves.insert(eq(PLAYER), eq(1), any())).thenReturn(new SaveRecord(SAVE_ID, 1, 1, AT));

    SaveAcceptedDto accepted = service.upload(PLAYER, 1, document(0));

    assertThat(accepted.version()).isEqualTo(1);
    assertThat(accepted.updatedAt()).isEqualTo(AT);
    ArgumentCaptor<SaveContent> content = ArgumentCaptor.forClass(SaveContent.class);
    verify(saves).insert(eq(PLAYER), eq(1), content.capture());
    verify(saves).replaceContents(SAVE_ID, content.getValue());
    assertThat(content.getValue().inventory()).containsExactly(new SaveContent.InventoryEntry("flor_destello", 5));
    verify(saves, never()).update(any(), any());
  }

  @Test
  void aLaterUploadUpdatesTheSlotWhenItBringsTheCurrentVersion() {
    when(saves.findForUpdate(PLAYER, 2)).thenReturn(Optional.of(new SaveRecord(SAVE_ID, 2, 3, AT.minusDays(1))));
    when(saves.update(eq(SAVE_ID), any())).thenReturn(new SaveRecord(SAVE_ID, 2, 4, AT));

    SaveAcceptedDto accepted = service.upload(PLAYER, 2, document(3));

    assertThat(accepted.version()).isEqualTo(4);
    verify(saves).replaceContents(eq(SAVE_ID), any());
    verify(saves, never()).insert(any(), anyInt(), any());
  }

  @Test
  void anOldVersionIsAConflictAndReportsWhatTheServerHas() {
    OffsetDateTime savedElsewhere = AT.minusMinutes(5);
    when(saves.findForUpdate(PLAYER, 1)).thenReturn(Optional.of(new SaveRecord(SAVE_ID, 1, 5, savedElsewhere)));

    var conflict = thrown(VersionConflictException.class, () -> service.upload(PLAYER, 1, document(4)));

    assertThat(conflict.serverVersion()).isEqualTo(5);
    assertThat(conflict.serverUpdatedAt()).isEqualTo(savedElsewhere);
    verifyNothingWritten();
  }

  @Test
  void aNewerVersionThanTheServerIsAlsoAConflict() {
    when(saves.findForUpdate(PLAYER, 1)).thenReturn(Optional.empty());

    var conflict = thrown(VersionConflictException.class, () -> service.upload(PLAYER, 1, document(2)));

    assertThat(conflict.serverVersion()).isZero();
    assertThat(conflict.serverUpdatedAt()).isNull();
    verifyNothingWritten();
  }

  @Test
  void anItemOutsideTheCatalogIsAValidationErrorNotADatabaseError() {
    when(catalog.unknownItems(anyList())).thenReturn(Set.of("golden_apple"));

    var ex = thrown(InvalidParameterException.class, () -> service.upload(PLAYER, 1, document(0)));

    assertThat(ex.field()).isEqualTo("inventory");
    assertThat(ex.code()).isEqualTo("UnknownItem");
    assertThat(ex.getMessage()).contains("golden_apple");
    verify(saves, never()).findForUpdate(any(), anyInt());
    verifyNothingWritten();
  }

  @Test
  void aMilestoneOutsideTheCatalogIsAValidationError() {
    when(catalog.unknownMilestones(anyList())).thenReturn(Set.of("woke_up"));

    var ex = thrown(InvalidParameterException.class, () -> service.upload(PLAYER, 1, document(0)));

    assertThat(ex.field()).isEqualTo("completedMilestones");
    assertThat(ex.code()).isEqualTo("UnknownMilestone");
    verifyNothingWritten();
  }

  @Test
  void anItemCanAppearOnlyOnceInTheInventory() {
    var repeated = List.of(new SaveDataDto.InventoryEntry("flor_destello", 5), new SaveDataDto.InventoryEntry("flor_destello", 1));

    var ex = thrown(InvalidParameterException.class, () -> service.upload(PLAYER, 1, document(0, repeated, Map.of("v", 1))));

    assertThat(ex.field()).isEqualTo("inventory");
    assertThat(ex.code()).isEqualTo("Duplicate");
    verifyNothingWritten();
  }

  @Test
  void extraDataMustCarryItsFormatVersion() {
    var inventory = List.of(new SaveDataDto.InventoryEntry("flor_destello", 5));
    Map<String, Object> versionAsText = new HashMap<>();
    versionAsText.put("v", "1");

    for (Map<String, Object> extra : List.of(Map.<String, Object>of(), Map.<String, Object>of("v", 0), versionAsText)) {
      var ex = thrown(InvalidParameterException.class, () -> service.upload(PLAYER, 1, document(0, inventory, extra)));
      assertThat(ex.field()).isEqualTo("extraData.v");
    }
    verifyNothingWritten();
  }

  // ------------------------------------------------------------------ read

  @Test
  void listMapsEverySlotSummary() {
    when(saves.listSummaries(PLAYER)).thenReturn(List.of(
        new SaveSummary(1, "TSUKI", 1, new SaveSummary.MilestoneRef("woke_up", "El despertar"), 1, 11, 600, AT, 2),
        new SaveSummary(3, "HIKARI", 0, null, 0, 11, 0, AT, 1)));

    var list = service.list(PLAYER);

    assertThat(list).extracting(s -> s.slot()).containsExactly(1, 3);
    assertThat(list.get(0).lastMilestone().id()).isEqualTo("woke_up");
    assertThat(list.get(1).lastMilestone()).isNull();
  }

  @Test
  void theDetailOfAnEmptySlotIsNotFound() {
    when(saves.findSummary(PLAYER, 2)).thenReturn(Optional.empty());

    thrown(NotFoundException.class, () -> service.detail(PLAYER, 2));
  }

  @Test
  void theDetailJoinsSummaryStatsInventoryAndMilestones() {
    when(saves.findSummary(PLAYER, 1)).thenReturn(Optional.of(new SaveSummary(1, "TSUKI", 1, null, 1, 2, 600, AT, 2)));
    when(saves.find(PLAYER, 1)).thenReturn(Optional.of(new SaveRecord(SAVE_ID, 1, 2, AT)));
    when(saves.readStats(SAVE_ID)).thenReturn(new SaveStats(600, 5, 1, 7, 0));
    when(saves.readInventoryDetail(SAVE_ID)).thenReturn(List.of(
        new InventoryItem("flor_destello", "Flor destello", "MATERIAL", "COMMON", "flor_destello", 5)));
    when(saves.readMilestones(SAVE_ID)).thenReturn(List.of(
        new MilestoneStatus("woke_up", "El despertar", 0, AT), new MilestoneStatus("has_sword", "La espada carmesí", 0, null)));

    var detail = service.detail(PLAYER, 1);

    assertThat(detail.stats().playTimeSec()).isEqualTo(600);
    assertThat(detail.inventory()).hasSize(1);
    assertThat(detail.milestones()).hasSize(2);
  }

  @Test
  void downloadReturnsTheStoredDocumentOrNotFound() {
    var record = new SaveRecord(SAVE_ID, 1, 2, AT);
    when(saves.find(PLAYER, 1)).thenReturn(Optional.of(record));
    when(saves.readData(record)).thenReturn(SaveMapper.toModel(document(2)));
    when(saves.find(PLAYER, 3)).thenReturn(Optional.empty());

    assertThat(service.download(PLAYER, 1)).isEqualTo(document(2));
    thrown(NotFoundException.class, () -> service.download(PLAYER, 3));
  }

  // ------------------------------------------------------------- telemetry

  @Test
  void sessionsReportHowManyWereNewAndHowManyRepeated() {
    when(saves.find(PLAYER, 1)).thenReturn(Optional.of(new SaveRecord(SAVE_ID, 1, 2, AT)));
    when(telemetry.insertSessions(eq(SAVE_ID), anyList())).thenReturn(1);
    var first = new PlaySessionInput(UUID.randomUUID(), AT.minusMinutes(30), AT, 1700, "WINDOWS", "1.0.0");
    var second = new PlaySessionInput(UUID.randomUUID(), AT.minusMinutes(10), AT, 500, "WINDOWS", "1.0.0");

    BatchResultDto result = service.uploadSessions(PLAYER, 1, List.of(first, second));

    assertThat(result).isEqualTo(new BatchResultDto(1, 1));
    @SuppressWarnings("unchecked")
    ArgumentCaptor<List<PlaySession>> sent = ArgumentCaptor.forClass(List.class);
    verify(telemetry).insertSessions(eq(SAVE_ID), sent.capture());
    assertThat(sent.getValue()).extracting(PlaySession::id).containsExactly(first.id(), second.id());
  }

  @Test
  void aSessionThatEndsBeforeItStartsIsRejectedWithItsIndex() {
    var ok = new PlaySessionInput(UUID.randomUUID(), AT.minusMinutes(30), AT, 1700, "WINDOWS", null);
    var backwards = new PlaySessionInput(UUID.randomUUID(), AT, AT.minusMinutes(1), 0, "WINDOWS", null);

    var ex = thrown(InvalidParameterException.class, () -> service.uploadSessions(PLAYER, 1, List.of(ok, backwards)));

    assertThat(ex.field()).isEqualTo("[1].endedAt");
    verify(telemetry, never()).insertSessions(any(), anyList());
  }

  @Test
  void sessionsAndEventsForAnEmptySlotAreNotFound() {
    when(saves.find(PLAYER, 3)).thenReturn(Optional.empty());
    var session = new PlaySessionInput(UUID.randomUUID(), AT.minusMinutes(30), AT, 1700, "WINDOWS", null);
    var event = new EventInput(UUID.randomUUID(), "DEATH", Map.of(), AT);

    thrown(NotFoundException.class, () -> service.uploadSessions(PLAYER, 3, List.of(session)));
    thrown(NotFoundException.class, () -> service.uploadEvents(PLAYER, 3, List.of(event)));
    verify(telemetry, never()).insertSessions(any(), anyList());
    verify(telemetry, never()).insertEvents(any(), anyList());
  }

  @Test
  void eventsReportHowManyWereNewAndHowManyRepeated() {
    when(saves.find(PLAYER, 1)).thenReturn(Optional.of(new SaveRecord(SAVE_ID, 1, 2, AT)));
    when(telemetry.insertEvents(eq(SAVE_ID), anyList())).thenReturn(2);
    var events = List.of(
        new EventInput(UUID.randomUUID(), "ENEMY_DEFEATED", Map.of("enemy", "slime"), AT),
        new EventInput(UUID.randomUUID(), "PICKUP", Map.of("item", "flor_destello"), AT),
        new EventInput(UUID.randomUUID(), "DEATH", null, AT));

    assertThat(service.uploadEvents(PLAYER, 1, events)).isEqualTo(new BatchResultDto(2, 1));

    @SuppressWarnings("unchecked")
    ArgumentCaptor<List<GameEvent>> sent = ArgumentCaptor.forClass(List.class);
    verify(telemetry).insertEvents(eq(SAVE_ID), sent.capture());
    assertThat(sent.getValue()).extracting(GameEvent::type).containsExactly("ENEMY_DEFEATED", "PICKUP", "DEATH");
  }
}