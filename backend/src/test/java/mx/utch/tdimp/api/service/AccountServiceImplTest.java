package mx.utch.tdimp.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import mx.utch.tdimp.api.dto.PageQuery;
import mx.utch.tdimp.api.dto.SettingsDto;
import mx.utch.tdimp.api.exception.ConflictException;
import mx.utch.tdimp.api.exception.ErrorCode;
import mx.utch.tdimp.api.exception.ForbiddenException;
import mx.utch.tdimp.api.exception.NotFoundException;
import mx.utch.tdimp.api.exception.UnauthenticatedException;
import mx.utch.tdimp.api.model.AccountSummary;
import mx.utch.tdimp.api.model.ClientType;
import mx.utch.tdimp.api.model.DeviceSession;
import mx.utch.tdimp.api.model.HistoryItem;
import mx.utch.tdimp.api.model.PlaySession;
import mx.utch.tdimp.api.model.Player;
import mx.utch.tdimp.api.model.RevocationReason;
import mx.utch.tdimp.api.model.Settings;
import mx.utch.tdimp.api.repository.AuthSessionRepository;
import mx.utch.tdimp.api.repository.HistoryReader;
import mx.utch.tdimp.api.repository.PlayerRepository;
import mx.utch.tdimp.api.repository.SettingsRepository;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Unit tests of AccountServiceImpl: profile, password, devices, deletion, settings and history.
 * Repositories and the password encoder are Mockito doubles; a fixed Clock decides "now".
 */
class AccountServiceImplTest {

  private static final Instant NOW_INSTANT = Instant.parse("2026-11-09T18:00:00Z");
  private static final OffsetDateTime NOW = OffsetDateTime.ofInstant(NOW_INSTANT, ZoneOffset.UTC);
  private static final UUID PLAYER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
  private static final UUID THIS_DEVICE = UUID.fromString("22222222-2222-2222-2222-222222222222");
  private static final UUID OTHER_DEVICE = UUID.fromString("33333333-3333-3333-3333-333333333333");
  private static final Player FELC =
      new Player(PLAYER_ID, "felc@example.com", "Felc", "{bcrypt}stored-hash", NOW.minusDays(10), NOW.minusDays(1));
  private static final AccountSummary SUMMARY = new AccountSummary(2, 9000L, 70L, 3L, 1, 6, NOW.minusHours(2));

  private final PlayerRepository players = mock(PlayerRepository.class);
  private final SettingsRepository settings = mock(SettingsRepository.class);
  private final HistoryReader history = mock(HistoryReader.class);
  private final AuthSessionRepository sessions = mock(AuthSessionRepository.class);
  private final PasswordEncoder passwords = mock(PasswordEncoder.class);
  private final AccountService service = new AccountServiceImpl(players, settings, history, sessions, passwords,
      Clock.fixed(NOW_INSTANT, ZoneOffset.UTC));

  @BeforeEach
  void setUp() {
    when(players.findById(PLAYER_ID)).thenReturn(Optional.of(FELC));
    when(history.summary(PLAYER_ID)).thenReturn(SUMMARY);
  }

  // --------------------------------------------------------------- helpers

  private static AccessClaims claims(ClientType client, Instant authTime) {
    return new AccessClaims(PLAYER_ID, THIS_DEVICE, client, authTime);
  }

  private static <T extends Throwable> T thrown(Class<T> type, ThrowingCallable call) {
    Throwable thrown = catchThrowable(call);
    assertThat(thrown).isInstanceOf(type);
    return type.cast(thrown);
  }

  // --------------------------------------------------------------- profile

  @Test
  void theAccountIncludesTheSummaryOfAllSlots() {
    var account = service.account(PLAYER_ID);

    assertThat(account.username()).isEqualTo("Felc");
    assertThat(account.email()).isEqualTo("felc@example.com");
    assertThat(account.summary().saves()).isEqualTo(2);
    assertThat(account.summary().playTimeSec()).isEqualTo(9000L);
    assertThat(account.summary().achievementsUnlocked()).isEqualTo(1);
    assertThat(account.summary().achievementsTotal()).isEqualTo(6);
    assertThat(account.summary().lastSessionAt()).isEqualTo(NOW.minusHours(2));
  }

  @Test
  void aValidTokenOfADeletedAccountSeesNothing() {
    when(players.findById(PLAYER_ID)).thenReturn(Optional.empty());

    assertThat(thrown(UnauthenticatedException.class, () -> service.account(PLAYER_ID)).code())
        .isEqualTo(ErrorCode.INVALID_SESSION);
  }

  @Test
  void renameChangesTheUsername() {
    var renamed = new Player(PLAYER_ID, "felc@example.com", "Felc_2", "{bcrypt}stored-hash", FELC.createdAt(), null);
    when(players.updateUsername(PLAYER_ID, "Felc_2")).thenReturn(Optional.of(renamed));

    assertThat(service.rename(PLAYER_ID, "Felc_2").username()).isEqualTo("Felc_2");
  }

  @Test
  void renameToANameOfAnotherPlayerIsAConflict() {
    when(players.usernameTakenByOther(PLAYER_ID, "Taken")).thenReturn(true);

    var ex = thrown(ConflictException.class, () -> service.rename(PLAYER_ID, "Taken"));

    assertThat(ex.code()).isEqualTo(ErrorCode.USERNAME_IN_USE);
    assertThat(ex.field()).isEqualTo("username");
    verify(players, never()).updateUsername(any(), any());
  }

  @Test
  void twoPlayersTakingTheSameNameAtOnceIsDecidedByTheUniqueIndex() {
    doThrow(new DuplicateKeyException("ux_players_username")).when(players).updateUsername(PLAYER_ID, "Race");

    assertThat(thrown(ConflictException.class, () -> service.rename(PLAYER_ID, "Race")).code())
        .isEqualTo(ErrorCode.USERNAME_IN_USE);
  }

  // -------------------------------------------------------------- password

  @Test
  void changingThePasswordStoresTheNewHashAndClosesTheOtherDevices() {
    when(passwords.matches("current-pass", "{bcrypt}stored-hash")).thenReturn(true);
    when(passwords.encode("brand-new-pass")).thenReturn("{bcrypt}new-hash");

    service.changePassword(claims(ClientType.WEB, NOW_INSTANT), "current-pass", "brand-new-pass");

    verify(players).updatePasswordHash(PLAYER_ID, "{bcrypt}new-hash");
    verify(sessions).revokeOtherFamilies(PLAYER_ID, THIS_DEVICE, RevocationReason.PASSWORD_CHANGED, NOW);
  }

  @Test
  void aWrongCurrentPasswordChangesNothing() {
    when(passwords.matches("wrong", "{bcrypt}stored-hash")).thenReturn(false);

    var ex = thrown(UnauthenticatedException.class,
        () -> service.changePassword(claims(ClientType.WEB, NOW_INSTANT), "wrong", "brand-new-pass"));

    assertThat(ex.code()).isEqualTo(ErrorCode.INVALID_CREDENTIALS);
    verify(players, never()).updatePasswordHash(any(), anyString());
    verify(sessions, never()).revokeOtherFamilies(any(), any(), any(), any());
  }

  // --------------------------------------------------------------- devices

  @Test
  void theDeviceListMarksTheCurrentOneAndDescribesEach() {
    when(sessions.activeFamilies(PLAYER_ID, NOW)).thenReturn(List.of(
        new DeviceSession(THIS_DEVICE, ClientType.WEB, "Mozilla/5.0 (Windows NT 10.0) Chrome/130.0", NOW.minusDays(1), NOW),
        new DeviceSession(OTHER_DEVICE, ClientType.UNITY_PC, null, NOW.minusDays(3), null)));

    var devices = service.devices(claims(ClientType.WEB, NOW_INSTANT));

    assertThat(devices).hasSize(2);
    assertThat(devices.get(0).current()).isTrue();
    assertThat(devices.get(0).description()).isEqualTo("Chrome · Windows");
    assertThat(devices.get(0).createdAt()).isEqualTo(NOW.minusDays(1));
    assertThat(devices.get(1).current()).isFalse();
    assertThat(devices.get(1).description()).isEqualTo("Juego · PC");
  }

  @Test
  void closingADeviceThatIsNotOursIsNotFound() {
    when(sessions.revokePlayerFamily(PLAYER_ID, OTHER_DEVICE, RevocationReason.REVOKED_BY_USER, NOW)).thenReturn(0);

    thrown(NotFoundException.class, () -> service.revokeDevice(claims(ClientType.WEB, NOW_INSTANT), OTHER_DEVICE));
  }

  @Test
  void closingAnOwnDeviceAndClosingAllTheOthers() {
    when(sessions.revokePlayerFamily(PLAYER_ID, OTHER_DEVICE, RevocationReason.REVOKED_BY_USER, NOW)).thenReturn(1);

    service.revokeDevice(claims(ClientType.WEB, NOW_INSTANT), OTHER_DEVICE);
    service.revokeOtherDevices(claims(ClientType.WEB, NOW_INSTANT));

    verify(sessions).revokePlayerFamily(PLAYER_ID, OTHER_DEVICE, RevocationReason.REVOKED_BY_USER, NOW);
    verify(sessions).revokeOtherFamilies(PLAYER_ID, THIS_DEVICE, RevocationReason.REVOKED_BY_USER, NOW);
  }

  // -------------------------------------------------------------- deletion

  @Test
  void theAccountCanOnlyBeDeletedFromTheWeb() {
    for (ClientType client : List.of(ClientType.MOBILE, ClientType.UNITY_PC)) {
      var ex = thrown(ForbiddenException.class, () -> service.deleteAccount(claims(client, NOW_INSTANT)));
      assertThat(ex.code()).isEqualTo(ErrorCode.DELETION_WEB_ONLY);
    }
    verify(players, never()).delete(any());
  }

  @Test
  void deletionNeedsThePasswordConfirmedInTheLastFiveMinutes() {
    when(players.delete(PLAYER_ID)).thenReturn(true);

    var ex = thrown(UnauthenticatedException.class,
        () -> service.deleteAccount(claims(ClientType.WEB, NOW_INSTANT.minusSeconds(301))));
    assertThat(ex.code()).isEqualTo(ErrorCode.REAUTHENTICATION_REQUIRED);
    verify(players, never()).delete(any());

    // Exactly 5 minutes ago is still inside the window.
    service.deleteAccount(claims(ClientType.WEB, NOW_INSTANT.minusSeconds(300)));
    verify(players).delete(PLAYER_ID);
  }

  @Test
  void deletingAnAccountThatNoLongerExistsIsInvalidSession() {
    when(players.delete(PLAYER_ID)).thenReturn(false);

    assertThat(thrown(UnauthenticatedException.class, () -> service.deleteAccount(claims(ClientType.WEB, NOW_INSTANT))).code())
        .isEqualTo(ErrorCode.INVALID_SESSION);
  }

  // -------------------------------------------------------------- settings

  @Test
  void settingsAreCreatedWithTheDefaultsTheFirstTimeTheyAreRead() {
    var defaults = new Settings(80, 80, "es", true, Map.of(), NOW);
    when(settings.find(PLAYER_ID)).thenReturn(Optional.empty(), Optional.of(defaults));

    SettingsDto dto = service.settings(PLAYER_ID);

    verify(settings).insertDefaults(PLAYER_ID);
    assertThat(dto.musicVolume()).isEqualTo(80);
    assertThat(dto.language()).isEqualTo("es");
    assertThat(dto.fullscreen()).isTrue();
  }

  @Test
  void replacingSettingsIgnoresTheUpdatedAtSentByTheClient() {
    when(settings.upsert(any(), any())).thenAnswer(call -> {
      Settings s = call.getArgument(1);
      return new Settings(s.musicVolume(), s.sfxVolume(), s.language(), s.fullscreen(), s.controls(), NOW);
    });

    SettingsDto saved = service.replaceSettings(PLAYER_ID,
        new SettingsDto(30, 55, "en", false, Map.of("attack", "J"), NOW.minusYears(5)));

    ArgumentCaptor<Settings> stored = ArgumentCaptor.forClass(Settings.class);
    verify(settings).upsert(eq(PLAYER_ID), stored.capture());
    assertThat(stored.getValue().updatedAt()).isNull();
    assertThat(stored.getValue().controls()).containsEntry("attack", "J");
    assertThat(saved.updatedAt()).isEqualTo(NOW);
    assertThat(saved.musicVolume()).isEqualTo(30);
  }

  // --------------------------------------------------------------- history

  @Test
  void sessionsArePagedWithTheSlotFilter() {
    var session = new PlaySession(UUID.randomUUID(), 2, NOW.minusHours(1), NOW, 3000, "WINDOWS", "1.0.0");
    when(history.sessions(PLAYER_ID, 2, 10, 20L)).thenReturn(List.of(session));
    when(history.countSessions(PLAYER_ID, 2)).thenReturn(21L);

    var page = service.sessions(PLAYER_ID, 2, new PageQuery(2, 10));

    assertThat(page.content()).singleElement().satisfies(s -> {
      assertThat(s.slot()).isEqualTo(2);
      assertThat(s.durationSec()).isEqualTo(3000);
    });
    assertThat(page.page().totalElements()).isEqualTo(21);
    assertThat(page.page().totalPages()).isEqualTo(3);
  }

  @Test
  void historyIsPagedWithTheTypeFilter() {
    when(history.history(PLAYER_ID, "MILESTONE", 20, 0L)).thenReturn(List.of(
        new HistoryItem("MILESTONE", "woke_up", NOW, 1, "El despertar", 300)));
    when(history.countHistory(PLAYER_ID, "MILESTONE")).thenReturn(1L);

    var page = service.history(PLAYER_ID, "MILESTONE", new PageQuery(0, 20));

    assertThat(page.content()).singleElement().satisfies(h -> {
      assertThat(h.type()).isEqualTo("MILESTONE");
      assertThat(h.referenceId()).isEqualTo("woke_up");
      assertThat(h.title()).isEqualTo("El despertar");
      assertThat(h.valueSec()).isEqualTo(300);
    });
    assertThat(page.page().totalPages()).isEqualTo(1);
  }
}