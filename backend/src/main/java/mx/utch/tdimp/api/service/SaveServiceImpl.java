package mx.utch.tdimp.api.service;

import java.util.List;
import java.util.UUID;
import mx.utch.tdimp.api.dto.BatchResultDto;
import mx.utch.tdimp.api.dto.EventInput;
import mx.utch.tdimp.api.dto.PlaySessionInput;
import mx.utch.tdimp.api.dto.SaveAcceptedDto;
import mx.utch.tdimp.api.dto.SaveDataDto;
import mx.utch.tdimp.api.dto.SaveDetailDto;
import mx.utch.tdimp.api.dto.SaveSummaryDto;
import mx.utch.tdimp.api.exception.InvalidParameterException;
import mx.utch.tdimp.api.exception.NotFoundException;
import mx.utch.tdimp.api.exception.VersionConflictException;
import mx.utch.tdimp.api.model.SaveRecord;
import mx.utch.tdimp.api.repository.CatalogReader;
import mx.utch.tdimp.api.repository.SaveRepository;
import mx.utch.tdimp.api.repository.TelemetryWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class SaveServiceImpl implements SaveService {

  private static final Logger log = LoggerFactory.getLogger(SaveServiceImpl.class);

  private final SaveRepository saves;
  private final CatalogReader catalog;
  private final TelemetryWriter telemetry;

  SaveServiceImpl(SaveRepository saves, CatalogReader catalog, TelemetryWriter telemetry) {
    this.saves = saves;
    this.catalog = catalog;
    this.telemetry = telemetry;
  }

  @Override
  @Transactional(readOnly = true)
  public List<SaveSummaryDto> list(UUID playerId) {
    return saves.listSummaries(playerId);
  }

  @Override
  @Transactional(readOnly = true)
  public SaveDetailDto detail(UUID playerId, int slot) {
    SaveSummaryDto s = saves.findSummary(playerId, slot).orElseThrow(() -> slotNotFound(slot));
    UUID saveId = saves.find(playerId, slot).orElseThrow().id();
    return new SaveDetailDto(s.slot(), s.activeCharacter(), s.currentChapter(), s.lastMilestone(), s.milestonesCompleted(),
        s.milestonesTotal(), s.playTimeSec(), s.updatedAt(), s.version(), saves.readStats(saveId),
        saves.readInventoryDetail(saveId), saves.readMilestones(saveId));
  }

  @Override
  @Transactional(readOnly = true)
  public SaveDataDto download(UUID playerId, int slot) {
    return saves.readData(saves.find(playerId, slot).orElseThrow(() -> slotNotFound(slot)));
  }

  @Override
  @Transactional
  public SaveAcceptedDto upload(UUID playerId, int slot, SaveDataDto data) {
    validateCatalogIds(data);
    Object formatVersion = data.extraData().get("v");
    if (!(formatVersion instanceof Number n) || n.intValue() < 1) {
      throw new InvalidParameterException("extraData.v", "Min", "extraData must include its format version v >= 1.");
    }

    var current = saves.findForUpdate(playerId, slot);
    int serverVersion = current.map(SaveRecord::version).orElse(0);
    if (data.version() != serverVersion) {
      log.info("Guardado rechazado: ranura {} versión enviada={} servidor={}", slot, data.version(), serverVersion);
      throw new VersionConflictException(serverVersion, current.map(SaveRecord::updatedAt).orElse(null));
    }

    SaveRecord saved = current.isPresent() ? saves.update(current.get().id(), data) : saves.insert(playerId, slot, data);
    saves.replaceContents(saved.id(), data);
    log.info("Guardado aceptado: jugador={} ranura={} versión={}", playerId, slot, saved.version());
    return new SaveAcceptedDto(saved.version(), saved.updatedAt());
  }

  @Override
  @Transactional
  public BatchResultDto uploadSessions(UUID playerId, int slot, List<PlaySessionInput> sessions) {
    for (int i = 0; i < sessions.size(); i++) {
      var s = sessions.get(i);
      if (s.endedAt().isBefore(s.startedAt())) {
        throw new InvalidParameterException("[" + i + "].endedAt", "Order", "endedAt must not be before startedAt.");
      }
    }
    UUID saveId = saves.find(playerId, slot).orElseThrow(() -> slotNotFound(slot)).id();
    int accepted = telemetry.insertSessions(saveId, sessions);
    return new BatchResultDto(accepted, sessions.size() - accepted);
  }

  @Override
  @Transactional
  public BatchResultDto uploadEvents(UUID playerId, int slot, List<EventInput> events) {
    UUID saveId = saves.find(playerId, slot).orElseThrow(() -> slotNotFound(slot)).id();
    int accepted = telemetry.insertEvents(saveId, events);
    return new BatchResultDto(accepted, events.size() - accepted);
  }

  // Un id que no está en el catálogo es un error del cliente (400), no de la BD (500 por la FK).
  private void validateCatalogIds(SaveDataDto data) {
    var unknownItems = catalog.unknownItems(data.inventory().stream().map(SaveDataDto.InventoryEntry::itemId).toList());
    if (!unknownItems.isEmpty()) {
      throw new InvalidParameterException("inventory", "UnknownItem", "Unknown item ids: " + unknownItems);
    }
    var unknownMilestones = catalog.unknownMilestones(
        data.completedMilestones().stream().map(SaveDataDto.CompletedMilestone::milestoneId).toList());
    if (!unknownMilestones.isEmpty()) {
      throw new InvalidParameterException("completedMilestones", "UnknownMilestone",
          "Unknown milestone ids: " + unknownMilestones);
    }
    long distinctItems = data.inventory().stream().map(SaveDataDto.InventoryEntry::itemId).distinct().count();
    if (distinctItems != data.inventory().size()) {
      throw new InvalidParameterException("inventory", "Duplicate", "Each itemId may appear only once.");
    }
  }

  private static NotFoundException slotNotFound(int slot) {
    return new NotFoundException("Slot " + slot + " has no save.");
  }
}
