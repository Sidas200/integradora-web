package mx.utch.tdimp.api.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;
import mx.utch.tdimp.api.config.TdimpProperties;
import mx.utch.tdimp.api.dto.LoginRequest;
import mx.utch.tdimp.api.dto.RegisterRequest;
import mx.utch.tdimp.api.dto.SessionPlayerDto;
import mx.utch.tdimp.api.dto.TokenResponse;
import mx.utch.tdimp.api.exception.ErrorCode;
import mx.utch.tdimp.api.exception.ConflictException;
import mx.utch.tdimp.api.exception.InvalidParameterException;
import mx.utch.tdimp.api.exception.UnauthenticatedException;
import mx.utch.tdimp.api.model.AuthSession;
import mx.utch.tdimp.api.model.ClientType;
import mx.utch.tdimp.api.model.Player;
import mx.utch.tdimp.api.model.RevocationReason;
import mx.utch.tdimp.api.repository.AuthSessionRepository;
import mx.utch.tdimp.api.repository.PlayerRepository;
import mx.utch.tdimp.api.repository.SettingsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class AuthServiceImpl implements AuthService {

  private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);
  private static final int USER_AGENT_MAX = 300;

  private final PlayerRepository players;
  private final AuthSessionRepository sessions;
  private final SettingsRepository settings;
  private final PasswordEncoder passwords;
  private final TokenIssuer tokens;
  private final TdimpProperties.Security properties;
  private final SecureRandom random = new SecureRandom();
  private final Clock clock = Clock.systemUTC();
  // Se compara contra este hash cuando el correo no existe: la respuesta tarda lo mismo.
  private final String dummyHash;

  AuthServiceImpl(PlayerRepository players, AuthSessionRepository sessions, SettingsRepository settings,
                  PasswordEncoder passwords, TokenIssuer tokens, TdimpProperties properties) {
    this.players = players;
    this.sessions = sessions;
    this.settings = settings;
    this.passwords = passwords;
    this.tokens = tokens;
    this.properties = properties.security();
    this.dummyHash = passwords.encode("timing-equalizer-password");
  }

  @Override
  @Transactional
  public AuthResult register(RegisterRequest request, String userAgent) {
    if (request.client() == ClientType.UNITY_PC) {
      throw new InvalidParameterException("client", "NotAllowed", "The game does not create accounts.");
    }
    String email = normalize(request.email());
    if (players.emailExists(email)) {
      throw new ConflictException(ErrorCode.EMAIL_IN_USE, "email", "Email is already registered.");
    }
    if (players.usernameExists(request.username())) {
      throw new ConflictException(ErrorCode.USERNAME_IN_USE, "username", "Username is already taken.");
    }
    OffsetDateTime now = OffsetDateTime.now(clock);
    Player player;
    try {
      player = players.insert(email, request.username(), passwords.encode(request.password()), now);
    } catch (DuplicateKeyException ex) {
      // Dos registros simultáneos con el mismo dato: el índice único decide.
      boolean emailTaken = ex.getMostSpecificCause().getMessage().contains("ux_players_email");
      throw emailTaken
          ? new ConflictException(ErrorCode.EMAIL_IN_USE, "email", "Email is already registered.")
          : new ConflictException(ErrorCode.USERNAME_IN_USE, "username", "Username is already taken.");
    }
    settings.insertDefaults(player.id());
    log.info("Cuenta creada: jugador={} cliente={}", player.id(), request.client());
    return startSession(player, request.client(), userAgent, now);
  }

  @Override
  @Transactional
  public AuthResult login(LoginRequest request, String userAgent) {
    var player = players.findByEmail(normalize(request.email()));
    boolean valid = passwords.matches(request.password(), player.map(Player::passwordHash).orElse(dummyHash));
    if (player.isEmpty() || !valid) {
      log.info("Login rechazado ({})", player.isEmpty() ? "correo no registrado" : "contraseña incorrecta");
      throw new UnauthenticatedException(ErrorCode.INVALID_CREDENTIALS, "Email or password is not valid.");
    }
    OffsetDateTime now = OffsetDateTime.now(clock);
    players.touchLastLogin(player.get().id(), now);
    log.info("Login: jugador={} cliente={}", player.get().id(), request.client());
    return startSession(player.get(), request.client(), userAgent, now);
  }

  @Override
  // El 401 no revierte la revocación por reuso: debe quedar guardada.
  @Transactional(noRollbackFor = UnauthenticatedException.class)
  public AuthResult refresh(String refreshToken, String userAgent) {
    OffsetDateTime now = OffsetDateTime.now(clock);
    AuthSession current = sessions.findByTokenHashForUpdate(hash(refreshToken)).orElseThrow(AuthServiceImpl::invalidSession);

    if (current.revokedAt() != null) {
      if (RevocationReason.ROTATED.name().equals(current.revocationReason())) {
        // Alguien presentó un token ya rotado: posible robo. Se corta toda la cadena.
        int revoked = sessions.revokeFamily(current.familyId(), RevocationReason.REUSE_DETECTED, now);
        log.warn("Reuso de refresh token: familia={} revocada ({} sesiones)", current.familyId(), revoked);
      }
      throw invalidSession();
    }
    if (!current.isActive(now)) {
      throw invalidSession();
    }

    Player player = players.findById(current.playerId()).orElseThrow(AuthServiceImpl::invalidSession);
    UUID nextId = UUID.randomUUID();
    String raw = newRefreshToken();
    sessions.insert(nextId, player.id(), current.familyId(), hash(raw), current.client(), truncate(userAgent),
        current.authenticatedAt(), now.plus(properties.refreshTokenTtl()));
    sessions.markRotated(current.id(), nextId, now);

    return new AuthResult(tokenResponse(player, current.familyId(), current.client(), current.authenticatedAt(), raw),
        current.client());
  }

  @Override
  @Transactional
  public void logout(String refreshToken) {
    sessions.findByTokenHashForUpdate(hash(refreshToken))
        .ifPresent(s -> sessions.revokeFamily(s.familyId(), RevocationReason.LOGOUT, OffsetDateTime.now(clock)));
  }

  private AuthResult startSession(Player player, ClientType client, String userAgent, OffsetDateTime now) {
    UUID familyId = UUID.randomUUID();
    String raw = newRefreshToken();
    sessions.insert(UUID.randomUUID(), player.id(), familyId, hash(raw), client, truncate(userAgent), now,
        now.plus(properties.refreshTokenTtl()));
    return new AuthResult(tokenResponse(player, familyId, client, now, raw), client);
  }

  private TokenResponse tokenResponse(Player player, UUID familyId, ClientType client, OffsetDateTime authTime,
                                      String refreshToken) {
    String access = tokens.issueAccessToken(player.id(), familyId, client, authTime.toInstant());
    return new TokenResponse(access, "Bearer", tokens.accessTokenTtlSeconds(), refreshToken,
        new SessionPlayerDto(player.id(), player.username(), player.email()));
  }

  // 32 bytes aleatorios en base64url = 43 caracteres. En la BD solo se guarda su SHA-256.
  private String newRefreshToken() {
    byte[] bytes = new byte[32];
    random.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }

  private static String hash(String token) {
    try {
      byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(digest);
    } catch (NoSuchAlgorithmException ex) {
      throw new IllegalStateException("SHA-256 unavailable", ex);
    }
  }

  private static String normalize(String email) {
    return email.trim().toLowerCase(Locale.ROOT);
  }

  private static String truncate(String userAgent) {
    return userAgent == null || userAgent.length() <= USER_AGENT_MAX ? userAgent : userAgent.substring(0, USER_AGENT_MAX);
  }

  private static UnauthenticatedException invalidSession() {
    return new UnauthenticatedException(ErrorCode.INVALID_SESSION, "The session is not valid. Log in again.");
  }
}
