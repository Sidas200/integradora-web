package mx.utch.tdimp.api.service;

import java.util.UUID;
import mx.utch.tdimp.api.dto.AccountDto;
import mx.utch.tdimp.api.dto.AccountSummaryDto;
import mx.utch.tdimp.api.dto.HistoryItemDto;
import mx.utch.tdimp.api.dto.PageQuery;
import mx.utch.tdimp.api.dto.PageResult;
import mx.utch.tdimp.api.dto.PlaySessionDto;
import mx.utch.tdimp.api.dto.SettingsDto;
import mx.utch.tdimp.api.exception.ErrorCode;
import mx.utch.tdimp.api.exception.UnauthenticatedException;
import mx.utch.tdimp.api.model.AccountSummary;
import mx.utch.tdimp.api.model.HistoryItem;
import mx.utch.tdimp.api.model.PlaySession;
import mx.utch.tdimp.api.model.Settings;
import mx.utch.tdimp.api.repository.HistoryReader;
import mx.utch.tdimp.api.repository.PlayerRepository;
import mx.utch.tdimp.api.repository.SettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class AccountServiceImpl implements AccountService {

  private final PlayerRepository players;
  private final SettingsRepository settings;
  private final HistoryReader history;

  AccountServiceImpl(PlayerRepository players, SettingsRepository settings, HistoryReader history) {
    this.players = players;
    this.settings = settings;
    this.history = history;
  }

  @Override
  @Transactional(readOnly = true)
  public AccountDto account(UUID playerId) {
    // Un token válido de una cuenta ya eliminada no debe ver nada.
    var player = players.findById(playerId)
        .orElseThrow(() -> new UnauthenticatedException(ErrorCode.INVALID_SESSION, "The account no longer exists."));
    return new AccountDto(player.id(), player.username(), player.email(), player.createdAt(), player.lastLoginAt(),
        toDto(history.summary(playerId)));
  }

  @Override
  @Transactional
  public SettingsDto settings(UUID playerId) {
    return toDto(settings.find(playerId).orElseGet(() -> {
      settings.insertDefaults(playerId);
      return settings.find(playerId).orElseThrow();
    }));
  }

  @Override
  @Transactional
  public SettingsDto replaceSettings(UUID playerId, SettingsDto replacement) {
    var model = new Settings(replacement.musicVolume(), replacement.sfxVolume(), replacement.language(),
        replacement.fullscreen(), replacement.controls(), null);
    return toDto(settings.upsert(playerId, model));
  }

  @Override
  @Transactional(readOnly = true)
  public PageResult<PlaySessionDto> sessions(UUID playerId, Integer slot, PageQuery page) {
    var rows = history.sessions(playerId, slot, page.size(), page.offset());
    return PageResult.of(rows.stream().map(AccountServiceImpl::sessionDto).toList(), page,
        history.countSessions(playerId, slot));
  }

  @Override
  @Transactional(readOnly = true)
  public PageResult<HistoryItemDto> history(UUID playerId, String type, PageQuery page) {
    var rows = history.history(playerId, type, page.size(), page.offset());
    return PageResult.of(rows.stream().map(AccountServiceImpl::historyDto).toList(), page,
        history.countHistory(playerId, type));
  }

  private static AccountSummaryDto toDto(AccountSummary s) {
    return new AccountSummaryDto(s.saves(), s.playTimeSec(), s.enemiesDefeated(), s.itemsCrafted(),
        s.achievementsUnlocked(), s.achievementsTotal(), s.lastSessionAt());
  }

  private static SettingsDto toDto(Settings s) {
    return new SettingsDto(s.musicVolume(), s.sfxVolume(), s.language(), s.fullscreen(), s.controls(), s.updatedAt());
  }

  private static PlaySessionDto sessionDto(PlaySession s) {
    return new PlaySessionDto(s.id(), s.slot(), s.startedAt(), s.endedAt(), s.durationSec(), s.platform());
  }

  private static HistoryItemDto historyDto(HistoryItem h) {
    return new HistoryItemDto(h.type(), h.referenceId(), h.occurredAt(), h.slot(), h.title(), h.valueSec());
  }
}
