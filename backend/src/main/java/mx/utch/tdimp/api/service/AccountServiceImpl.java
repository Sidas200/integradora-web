package mx.utch.tdimp.api.service;

import java.time.Clock;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import mx.utch.tdimp.api.dto.AccountDto;
import mx.utch.tdimp.api.dto.AccountSummaryDto;
import mx.utch.tdimp.api.dto.DeviceDto;
import mx.utch.tdimp.api.dto.HistoryItemDto;
import mx.utch.tdimp.api.dto.PageQuery;
import mx.utch.tdimp.api.dto.PageResult;
import mx.utch.tdimp.api.dto.PlaySessionDto;
import mx.utch.tdimp.api.dto.SettingsDto;
import mx.utch.tdimp.api.exception.ConflictException;
import mx.utch.tdimp.api.exception.ErrorCode;
import mx.utch.tdimp.api.exception.ForbiddenException;
import mx.utch.tdimp.api.exception.NotFoundException;
import mx.utch.tdimp.api.exception.UnauthenticatedException;
import mx.utch.tdimp.api.model.AccountSummary;
import mx.utch.tdimp.api.model.ClientType;
import mx.utch.tdimp.api.model.HistoryItem;
import mx.utch.tdimp.api.model.Player;
import mx.utch.tdimp.api.model.PlaySession;
import mx.utch.tdimp.api.model.RevocationReason;
import mx.utch.tdimp.api.model.Settings;
import mx.utch.tdimp.api.repository.AuthSessionRepository;
import mx.utch.tdimp.api.repository.HistoryReader;
import mx.utch.tdimp.api.repository.PlayerRepository;
import mx.utch.tdimp.api.repository.SettingsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class AccountServiceImpl implements AccountService {

  private static final Logger log = LoggerFactory.getLogger(AccountServiceImpl.class);
  // Eliminar la cuenta exige haber escrito la contraseña hace 5 minutos o menos (contrato, DELETE /account).
  private static final Duration REAUTH_WINDOW = Duration.ofMinutes(5);

  private final PlayerRepository players;
  private final SettingsRepository settings;
  private final HistoryReader history;
  private final AuthSessionRepository sessions;
  private final PasswordEncoder passwords;
  private final Clock clock;

  AccountServiceImpl(PlayerRepository players, SettingsRepository settings, HistoryReader history,
                     AuthSessionRepository sessions, PasswordEncoder passwords, Clock clock) {
    this.players = players;
    this.settings = settings;
    this.history = history;
    this.sessions = sessions;
    this.passwords = passwords;
    this.clock = clock;
  }

  @Override
  @Transactional(readOnly = true)
  public AccountDto account(UUID playerId) {
    return toDto(existing(playerId));
  }

  @Override
  @Transactional
  public AccountDto rename(UUID playerId, String username) {
    existing(playerId);
    if (players.usernameTakenByOther(playerId, username)) {
      throw new ConflictException(ErrorCode.USERNAME_IN_USE, "username", "Username is already taken.");
    }
    try {
      Player renamed = players.updateUsername(playerId, username).orElseThrow(AccountServiceImpl::accountGone);
      log.info("Nombre de usuario cambiado: jugador={}", playerId);
      return toDto(renamed);
    } catch (DuplicateKeyException race) {
      // Otro jugador tomó el mismo nombre entre la consulta y el UPDATE: el índice único decide.
      throw new ConflictException(ErrorCode.USERNAME_IN_USE, "username", "Username is already taken.");
    }
  }

  @Override
  @Transactional
  public void changePassword(AccessClaims claims, String currentPassword, String newPassword) {
    Player player = existing(claims.playerId());
    if (!passwords.matches(currentPassword, player.passwordHash())) {
      throw new UnauthenticatedException(ErrorCode.INVALID_CREDENTIALS, "The current password is not valid.");
    }
    players.updatePasswordHash(player.id(), passwords.encode(newPassword));
    // Si alguien más conocía la contraseña anterior, sus sesiones dejan de funcionar; este dispositivo sigue dentro.
    int revoked = sessions.revokeOtherFamilies(player.id(), claims.sessionId(), RevocationReason.PASSWORD_CHANGED,
        now());
    log.info("Contraseña cambiada: jugador={} sesiones cerradas={}", player.id(), revoked);
  }

  @Override
  @Transactional(readOnly = true)
  public List<DeviceDto> devices(AccessClaims claims) {
    return sessions.activeFamilies(claims.playerId(), now()).stream()
        .map(d -> new DeviceDto(d.familyId(), d.client(), DeviceNames.describe(d.client(), d.userAgent()),
            d.authenticatedAt(), d.lastUsedAt(), d.familyId().equals(claims.sessionId())))
        .toList();
  }

  @Override
  @Transactional
  public void revokeDevice(AccessClaims claims, UUID deviceId) {
    if (sessions.revokePlayerFamily(claims.playerId(), deviceId, RevocationReason.REVOKED_BY_USER, now()) == 0) {
      throw new NotFoundException("Device not found: " + deviceId);
    }
    log.info("Dispositivo cerrado por el jugador: jugador={} dispositivo={}", claims.playerId(), deviceId);
  }

  @Override
  @Transactional
  public void revokeOtherDevices(AccessClaims claims) {
    int revoked = sessions.revokeOtherFamilies(claims.playerId(), claims.sessionId(),
        RevocationReason.REVOKED_BY_USER, now());
    log.info("Otros dispositivos cerrados: jugador={} sesiones={}", claims.playerId(), revoked);
  }

  @Override
  @Transactional
  public void deleteAccount(AccessClaims claims) {
    if (claims.client() != ClientType.WEB) {
      throw new ForbiddenException(ErrorCode.DELETION_WEB_ONLY, "The account can only be deleted from the web.");
    }
    if (claims.authTime().isBefore(clock.instant().minus(REAUTH_WINDOW))) {
      throw new UnauthenticatedException(ErrorCode.REAUTHENTICATION_REQUIRED,
          "Confirm your password (POST /auth/reauthenticate) before deleting the account.");
    }
    if (!players.delete(claims.playerId())) {
      throw accountGone();
    }
    log.info("Cuenta eliminada: jugador={}", claims.playerId());
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

  // ------------------------------------------------------------------ helpers

  // Un token válido de una cuenta ya eliminada no debe ver ni cambiar nada.
  private Player existing(UUID playerId) {
    return players.findById(playerId).orElseThrow(AccountServiceImpl::accountGone);
  }

  private static UnauthenticatedException accountGone() {
    return new UnauthenticatedException(ErrorCode.INVALID_SESSION, "The account no longer exists.");
  }

  private OffsetDateTime now() {
    return OffsetDateTime.now(clock);
  }

  private AccountDto toDto(Player player) {
    return new AccountDto(player.id(), player.username(), player.email(), player.createdAt(), player.lastLoginAt(),
        toDto(history.summary(player.id())));
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