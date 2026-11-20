package mx.utch.tdimp.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;
import mx.utch.tdimp.api.config.TdimpProperties;
import mx.utch.tdimp.api.dto.LoginRequest;
import mx.utch.tdimp.api.dto.RegisterRequest;
import mx.utch.tdimp.api.dto.TokenResponse;
import mx.utch.tdimp.api.exception.ConflictException;
import mx.utch.tdimp.api.exception.ErrorCode;
import mx.utch.tdimp.api.exception.InvalidParameterException;
import mx.utch.tdimp.api.exception.UnauthenticatedException;
import mx.utch.tdimp.api.model.AuthSession;
import mx.utch.tdimp.api.model.ClientType;
import mx.utch.tdimp.api.model.Player;
import mx.utch.tdimp.api.model.RevocationReason;
import mx.utch.tdimp.api.repository.AuthSessionRepository;
import mx.utch.tdimp.api.repository.PlayerRepository;
import mx.utch.tdimp.api.repository.SettingsRepository;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Unit tests of AuthServiceImpl: repositories, password encoder and token issuer are Mockito doubles,
 * and a fixed Clock makes every date predictable. No Spring and no database.
 */
class AuthServiceImplTest {

  private static final Instant NOW_INSTANT = Instant.parse("2026-11-09T18:00:00Z");
  private static final OffsetDateTime NOW = OffsetDateTime.ofInstant(NOW_INSTANT, ZoneOffset.UTC);
  private static final Duration REFRESH_TTL = Duration.ofDays(30);
  private static final String PASSWORD = "a-long-passphrase";
  private static final String PASSWORD_HASH = "{bcrypt}stored-hash";
  private static final String DUMMY_HASH = "{bcrypt}dummy-hash";
  private static final String USER_AGENT = "Mozilla/5.0 (Windows NT 10.0)";

  private static final UUID PLAYER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
  private static final UUID FAMILY_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
  private static final UUID SESSION_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");
  private static final Player FELC =
      new Player(PLAYER_ID, "felc@example.com", "Felc", PASSWORD_HASH, NOW.minusDays(10), NOW.minusDays(1));

  private final PlayerRepository players = mock(PlayerRepository.class);
  private final AuthSessionRepository sessions = mock(AuthSessionRepository.class);
  private final SettingsRepository settings = mock(SettingsRepository.class);
  private final PasswordEncoder passwords = mock(PasswordEncoder.class);
  private final TokenIssuer tokens = mock(TokenIssuer.class);

  private AuthService service;

  @BeforeEach
  void setUp() {
    // The constructor hashes a dummy password once: it must exist before the service is built.
    when(passwords.encode("timing-equalizer-password")).thenReturn(DUMMY_HASH);
    when(passwords.encode(PASSWORD)).thenReturn(PASSWORD_HASH);
    when(tokens.issueAccessToken(any(), any(), any(), any())).thenReturn("access-token");
    when(tokens.accessTokenTtlSeconds()).thenReturn(900L);

    var properties = new TdimpProperties(new TdimpProperties.Security(
        "unit-test-secret-with-at-least-32-characters", Duration.ofMinutes(15), REFRESH_TTL));
    service = new AuthServiceImpl(players, sessions, settings, passwords, tokens, properties,
        Clock.fixed(NOW_INSTANT, ZoneOffset.UTC));
  }

  // --------------------------------------------------------------- helpers

  private static String sha256(String value) throws Exception {
    byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
    return HexFormat.of().formatHex(digest);
  }

  private static <T extends Throwable> T thrown(Class<T> type, ThrowingCallable call) {
    Throwable thrown = catchThrowable(call);
    assertThat(thrown).isInstanceOf(type);
    return type.cast(thrown);
  }

  private static ErrorCode unauthenticated(ThrowingCallable call) {
    return thrown(UnauthenticatedException.class, call).code();
  }

  private static AuthSession activeSession(ClientType client, OffsetDateTime authenticatedAt) {
    return new AuthSession(SESSION_ID, PLAYER_ID, FAMILY_ID, client, authenticatedAt, NOW.plusDays(5), null, null);
  }

  private static AuthSession revokedSession(RevocationReason reason) {
    return new AuthSession(SESSION_ID, PLAYER_ID, FAMILY_ID, ClientType.MOBILE, NOW.minusDays(3), NOW.plusDays(5),
        NOW.minusHours(1), reason.name());
  }

  private void verifyNoNewSession() {
    verify(sessions, never()).insert(any(), any(), any(), any(), any(), any(), any(), any());
  }

  // -------------------------------------------------------------- register

  @Test
  void registerNormalizesTheEmailCreatesDefaultSettingsAndStartsASession() throws Exception {
    when(players.insert("felc@example.com", "Felc", PASSWORD_HASH, NOW)).thenReturn(FELC);

    AuthResult result = service.register(
        new RegisterRequest("  Felc@Example.COM ", "Felc", PASSWORD, true, ClientType.MOBILE), USER_AGENT);

    verify(players).insert("felc@example.com", "Felc", PASSWORD_HASH, NOW);
    verify(settings).insertDefaults(PLAYER_ID);

    ArgumentCaptor<UUID> family = ArgumentCaptor.forClass(UUID.class);
    ArgumentCaptor<String> storedHash = ArgumentCaptor.forClass(String.class);
    verify(sessions).insert(any(UUID.class), eq(PLAYER_ID), family.capture(), storedHash.capture(),
        eq(ClientType.MOBILE), eq(USER_AGENT), eq(NOW), eq(NOW.plus(REFRESH_TTL)));

    TokenResponse tokensOut = result.tokens();
    assertThat(result.client()).isEqualTo(ClientType.MOBILE);
    assertThat(tokensOut.accessToken()).isEqualTo("access-token");
    assertThat(tokensOut.tokenType()).isEqualTo("Bearer");
    assertThat(tokensOut.expiresInSec()).isEqualTo(900L);
    assertThat(tokensOut.player().id()).isEqualTo(PLAYER_ID);
    assertThat(tokensOut.player().username()).isEqualTo("Felc");
    // 32 random bytes in base64url; the database only keeps its SHA-256.
    assertThat(tokensOut.refreshToken()).hasSize(43).matches("^[A-Za-z0-9_-]+$");
    assertThat(storedHash.getValue()).isEqualTo(sha256(tokensOut.refreshToken())).isNotEqualTo(tokensOut.refreshToken());
    verify(tokens).issueAccessToken(PLAYER_ID, family.getValue(), ClientType.MOBILE, NOW_INSTANT);
  }

  @Test
  void eachSessionGetsItsOwnRefreshToken() {
    when(players.insert(anyString(), anyString(), anyString(), any())).thenReturn(FELC);
    var request = new RegisterRequest("felc@example.com", "Felc", PASSWORD, true, ClientType.WEB);

    String first = service.register(request, USER_AGENT).tokens().refreshToken();
    String second = service.register(request, USER_AGENT).tokens().refreshToken();

    assertThat(first).isNotEqualTo(second);
  }

  @Test
  void theGameCannotCreateAccounts() {
    var request = new RegisterRequest("felc@example.com", "Felc", PASSWORD, true, ClientType.UNITY_PC);

    var ex = thrown(InvalidParameterException.class, () -> service.register(request, USER_AGENT));

    assertThat(ex.field()).isEqualTo("client");
    verify(players, never()).insert(any(), any(), any(), any());
  }

  @Test
  void registerRejectsAnEmailThatIsAlreadyRegistered() {
    when(players.emailExists("felc@example.com")).thenReturn(true);
    var request = new RegisterRequest("FELC@example.com", "Felc", PASSWORD, true, ClientType.WEB);

    var ex = thrown(ConflictException.class, () -> service.register(request, USER_AGENT));

    assertThat(ex.code()).isEqualTo(ErrorCode.EMAIL_IN_USE);
    assertThat(ex.field()).isEqualTo("email");
    verify(players, never()).insert(any(), any(), any(), any());
  }

  @Test
  void registerRejectsAUsernameThatIsTaken() {
    when(players.usernameExists("Felc")).thenReturn(true);
    var request = new RegisterRequest("felc@example.com", "Felc", PASSWORD, true, ClientType.WEB);

    var ex = thrown(ConflictException.class, () -> service.register(request, USER_AGENT));

    assertThat(ex.code()).isEqualTo(ErrorCode.USERNAME_IN_USE);
    assertThat(ex.field()).isEqualTo("username");
    verify(players, never()).insert(any(), any(), any(), any());
  }

  @Test
  void twoSimultaneousRegistersAreDecidedByTheUniqueIndex() {
    var request = new RegisterRequest("felc@example.com", "Felc", PASSWORD, true, ClientType.WEB);

    // doThrow instead of when(...): re-stubbing with when() would call the method that already throws.
    doThrow(new DuplicateKeyException("duplicate",
        new RuntimeException("duplicate key value violates unique constraint \"ux_players_email\"")))
        .when(players).insert(anyString(), anyString(), anyString(), any());
    assertThat(thrown(ConflictException.class, () -> service.register(request, USER_AGENT)).code())
        .isEqualTo(ErrorCode.EMAIL_IN_USE);

    doThrow(new DuplicateKeyException("duplicate",
        new RuntimeException("duplicate key value violates unique constraint \"ux_players_username\"")))
        .when(players).insert(anyString(), anyString(), anyString(), any());
    assertThat(thrown(ConflictException.class, () -> service.register(request, USER_AGENT)).code())
        .isEqualTo(ErrorCode.USERNAME_IN_USE);

    verify(settings, never()).insertDefaults(any());
    verifyNoNewSession();
  }

  @Test
  void aVeryLongUserAgentIsCutTo300Characters() {
    when(players.insert(anyString(), anyString(), anyString(), any())).thenReturn(FELC);

    service.register(new RegisterRequest("felc@example.com", "Felc", PASSWORD, true, ClientType.WEB), "x".repeat(500));

    ArgumentCaptor<String> userAgent = ArgumentCaptor.forClass(String.class);
    verify(sessions).insert(any(), any(), any(), any(), any(), userAgent.capture(), any(), any());
    assertThat(userAgent.getValue()).hasSize(300);
  }

  // ----------------------------------------------------------------- login

  @Test
  void loginWithTheRightPasswordStartsANewSessionAndRecordsTheLogin() {
    when(players.findByEmail("felc@example.com")).thenReturn(Optional.of(FELC));
    when(passwords.matches(PASSWORD, PASSWORD_HASH)).thenReturn(true);

    AuthResult result = service.login(new LoginRequest(" Felc@example.com", PASSWORD, ClientType.UNITY_PC), null);

    assertThat(result.client()).isEqualTo(ClientType.UNITY_PC);
    assertThat(result.tokens().refreshToken()).hasSize(43);
    verify(players).touchLastLogin(PLAYER_ID, NOW);
    verify(sessions).insert(any(UUID.class), eq(PLAYER_ID), any(UUID.class), anyString(), eq(ClientType.UNITY_PC),
        isNull(), eq(NOW), eq(NOW.plus(REFRESH_TTL)));
  }

  @Test
  void aWrongPasswordIsInvalidCredentialsAndOpensNothing() {
    when(players.findByEmail("felc@example.com")).thenReturn(Optional.of(FELC));
    when(passwords.matches("wrong-password", PASSWORD_HASH)).thenReturn(false);

    ErrorCode code = unauthenticated(() ->
        service.login(new LoginRequest("felc@example.com", "wrong-password", ClientType.WEB), USER_AGENT));

    assertThat(code).isEqualTo(ErrorCode.INVALID_CREDENTIALS);
    verify(players, never()).touchLastLogin(any(), any());
    verifyNoNewSession();
  }

  @Test
  void anUnknownEmailGivesTheSameErrorAndStillChecksAPassword() {
    when(players.findByEmail("nobody@example.com")).thenReturn(Optional.empty());

    ErrorCode code = unauthenticated(() ->
        service.login(new LoginRequest("nobody@example.com", PASSWORD, ClientType.WEB), USER_AGENT));

    assertThat(code).isEqualTo(ErrorCode.INVALID_CREDENTIALS);
    // Comparing against the dummy hash makes the answer take as long as with a real account.
    verify(passwords).matches(PASSWORD, DUMMY_HASH);
    verifyNoNewSession();
  }

  // --------------------------------------------------------------- refresh

  @Test
  void refreshRotatesTheTokenInsideTheSameFamilyAndKeepsTheLoginTime() throws Exception {
    OffsetDateTime loggedInAt = NOW.minusDays(3);
    when(sessions.findByTokenHashForUpdate(sha256("old-refresh-token")))
        .thenReturn(Optional.of(activeSession(ClientType.MOBILE, loggedInAt)));
    when(players.findById(PLAYER_ID)).thenReturn(Optional.of(FELC));

    AuthResult result = service.refresh("old-refresh-token", USER_AGENT);

    String newToken = result.tokens().refreshToken();
    assertThat(newToken).hasSize(43).isNotEqualTo("old-refresh-token");
    assertThat(result.client()).isEqualTo(ClientType.MOBILE);

    ArgumentCaptor<UUID> nextId = ArgumentCaptor.forClass(UUID.class);
    verify(sessions).insert(nextId.capture(), eq(PLAYER_ID), eq(FAMILY_ID), eq(sha256(newToken)), eq(ClientType.MOBILE),
        eq(USER_AGENT), eq(loggedInAt), eq(NOW.plus(REFRESH_TTL)));
    verify(sessions).markRotated(SESSION_ID, nextId.getValue(), NOW);
    // auth_time stays the moment of the login, not the moment of the refresh.
    verify(tokens).issueAccessToken(PLAYER_ID, FAMILY_ID, ClientType.MOBILE, loggedInAt.toInstant());
  }

  @Test
  void reusingARotatedTokenRevokesTheWholeFamily() throws Exception {
    when(sessions.findByTokenHashForUpdate(sha256("stolen-token")))
        .thenReturn(Optional.of(revokedSession(RevocationReason.ROTATED)));

    assertThat(unauthenticated(() -> service.refresh("stolen-token", USER_AGENT))).isEqualTo(ErrorCode.INVALID_SESSION);

    verify(sessions).revokeFamily(FAMILY_ID, RevocationReason.REUSE_DETECTED, NOW);
    verifyNoNewSession();
  }

  @Test
  void aTokenClosedForAnotherReasonIsRejectedWithoutRevokingAgain() throws Exception {
    when(sessions.findByTokenHashForUpdate(sha256("logged-out-token")))
        .thenReturn(Optional.of(revokedSession(RevocationReason.LOGOUT)));

    assertThat(unauthenticated(() -> service.refresh("logged-out-token", USER_AGENT)))
        .isEqualTo(ErrorCode.INVALID_SESSION);

    verify(sessions, never()).revokeFamily(any(), any(), any());
    verifyNoNewSession();
  }

  @Test
  void anExpiredTokenIsInvalidSession() throws Exception {
    var expired = new AuthSession(SESSION_ID, PLAYER_ID, FAMILY_ID, ClientType.MOBILE, NOW.minusDays(30), NOW, null, null);
    when(sessions.findByTokenHashForUpdate(sha256("expired-token"))).thenReturn(Optional.of(expired));

    assertThat(unauthenticated(() -> service.refresh("expired-token", USER_AGENT))).isEqualTo(ErrorCode.INVALID_SESSION);
    verifyNoNewSession();
  }

  @Test
  void anUnknownTokenIsInvalidSession() {
    when(sessions.findByTokenHashForUpdate(anyString())).thenReturn(Optional.empty());

    assertThat(unauthenticated(() -> service.refresh("never-issued", USER_AGENT))).isEqualTo(ErrorCode.INVALID_SESSION);
    verifyNoNewSession();
  }

  @Test
  void aSessionWhosePlayerNoLongerExistsIsInvalidSession() throws Exception {
    when(sessions.findByTokenHashForUpdate(sha256("orphan-token")))
        .thenReturn(Optional.of(activeSession(ClientType.WEB, NOW.minusDays(1))));
    when(players.findById(PLAYER_ID)).thenReturn(Optional.empty());

    assertThat(unauthenticated(() -> service.refresh("orphan-token", USER_AGENT))).isEqualTo(ErrorCode.INVALID_SESSION);
    verifyNoNewSession();
  }

  // ---------------------------------------------------------------- logout

  @Test
  void logoutRevokesTheWholeFamilyOfTheToken() throws Exception {
    when(sessions.findByTokenHashForUpdate(sha256("refresh-token")))
        .thenReturn(Optional.of(activeSession(ClientType.WEB, NOW.minusDays(1))));

    service.logout("refresh-token");

    verify(sessions).revokeFamily(FAMILY_ID, RevocationReason.LOGOUT, NOW);
  }

  @Test
  void logoutWithAnUnknownTokenDoesNothingAndDoesNotFail() {
    when(sessions.findByTokenHashForUpdate(anyString())).thenReturn(Optional.empty());

    service.logout("never-issued");

    verify(sessions, never()).revokeFamily(any(), any(), any());
  }

  // -------------------------------------------------------- reauthenticate

  @Test
  void reauthenticateGivesAnAccessTokenWithAFreshAuthTimeAndNoRefreshToken() {
    var claims = new AccessClaims(PLAYER_ID, FAMILY_ID, ClientType.WEB, NOW_INSTANT.minusSeconds(3600));
    when(sessions.familyActive(PLAYER_ID, FAMILY_ID, NOW)).thenReturn(true);
    when(players.findById(PLAYER_ID)).thenReturn(Optional.of(FELC));
    when(passwords.matches(PASSWORD, PASSWORD_HASH)).thenReturn(true);

    TokenResponse response = service.reauthenticate(claims, PASSWORD);

    assertThat(response.accessToken()).isEqualTo("access-token");
    assertThat(response.refreshToken()).isNull();
    verify(tokens).issueAccessToken(PLAYER_ID, FAMILY_ID, ClientType.WEB, NOW_INSTANT);
    verifyNoNewSession();
  }

  @Test
  void reauthenticateFromAClosedSessionIsInvalidSession() {
    var claims = new AccessClaims(PLAYER_ID, FAMILY_ID, ClientType.WEB, NOW_INSTANT);
    when(sessions.familyActive(PLAYER_ID, FAMILY_ID, NOW)).thenReturn(false);

    assertThat(unauthenticated(() -> service.reauthenticate(claims, PASSWORD))).isEqualTo(ErrorCode.INVALID_SESSION);
    verify(passwords, never()).matches(eq(PASSWORD), eq(PASSWORD_HASH));
  }

  @Test
  void reauthenticateWithAWrongPasswordIsInvalidCredentials() {
    var claims = new AccessClaims(PLAYER_ID, FAMILY_ID, ClientType.WEB, NOW_INSTANT);
    when(sessions.familyActive(PLAYER_ID, FAMILY_ID, NOW)).thenReturn(true);
    when(players.findById(PLAYER_ID)).thenReturn(Optional.of(FELC));
    when(passwords.matches("wrong-password", PASSWORD_HASH)).thenReturn(false);

    assertThat(unauthenticated(() -> service.reauthenticate(claims, "wrong-password")))
        .isEqualTo(ErrorCode.INVALID_CREDENTIALS);
    verify(tokens, never()).issueAccessToken(any(), any(), any(), any());
  }
}