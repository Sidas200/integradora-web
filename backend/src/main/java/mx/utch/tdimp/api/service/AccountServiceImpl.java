package mx.utch.tdimp.api.service;

import java.util.UUID;
import mx.utch.tdimp.api.dto.AccountDto;
import mx.utch.tdimp.api.dto.HistoryItemDto;
import mx.utch.tdimp.api.dto.PageQuery;
import mx.utch.tdimp.api.dto.PageResult;
import mx.utch.tdimp.api.dto.PlaySessionDto;
import mx.utch.tdimp.api.dto.SettingsDto;
import mx.utch.tdimp.api.exception.UnauthenticatedException;
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
        .orElseThrow(() -> new UnauthenticatedException("INVALID_SESSION", "The account no longer exists."));
    return new AccountDto(player.id(), player.username(), player.email(), player.createdAt(), player.lastLoginAt(),
        history.summary(playerId));
  }

  @Override
  @Transactional
  public SettingsDto settings(UUID playerId) {
    return settings.find(playerId).orElseGet(() -> {
      settings.insertDefaults(playerId);
      return settings.find(playerId).orElseThrow();
    });
  }

  @Override
  @Transactional
  public SettingsDto replaceSettings(UUID playerId, SettingsDto replacement) {
    return settings.upsert(playerId, replacement);
  }

  @Override
  @Transactional(readOnly = true)
  public PageResult<PlaySessionDto> sessions(UUID playerId, Integer slot, PageQuery page) {
    return PageResult.of(history.sessions(playerId, slot, page.size(), page.offset()), page,
        history.countSessions(playerId, slot));
  }

  @Override
  @Transactional(readOnly = true)
  public PageResult<HistoryItemDto> history(UUID playerId, String type, PageQuery page) {
    return PageResult.of(history.history(playerId, type, page.size(), page.offset()), page,
        history.countHistory(playerId, type));
  }
}
