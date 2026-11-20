package mx.utch.tdimp.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;

import com.jayway.jsonpath.JsonPath;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import mx.utch.tdimp.api.config.TdimpProperties;
import mx.utch.tdimp.api.exception.ErrorCode;
import mx.utch.tdimp.api.exception.UnauthenticatedException;
import mx.utch.tdimp.api.model.ClientType;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import tools.jackson.databind.json.JsonMapper;

/**
 * Unit tests of the access token (HS256 JWT signed with JWT_SECRET), without Spring.
 * A fixed Clock lets the test move time forward to check the expiration.
 */
class HmacTokenIssuerTest {

  private static final String SECRET = "unit-test-secret-with-at-least-32-characters";
  private static final Duration TTL = Duration.ofMinutes(15);
  private static final Instant NOW = Instant.parse("2026-11-09T18:00:00Z");
  private static final String HEADER = encode("{\"alg\":\"HS256\",\"typ\":\"JWT\"}");

  private static final UUID PLAYER = UUID.fromString("11111111-1111-1111-1111-111111111111");
  private static final UUID FAMILY = UUID.fromString("22222222-2222-2222-2222-222222222222");
  private static final Instant AUTH_TIME = NOW.minusSeconds(120);

  // --------------------------------------------------------------- helpers

  private static HmacTokenIssuer issuerAt(Instant instant, String secret) {
    var properties = new TdimpProperties(new TdimpProperties.Security(secret, TTL, Duration.ofDays(30)));
    return new HmacTokenIssuer(properties, JsonMapper.builder().build(), Clock.fixed(instant, ZoneOffset.UTC));
  }

  private static HmacTokenIssuer issuerAt(Instant instant) {
    return issuerAt(instant, SECRET);
  }

  private static String issue() {
    return issuerAt(NOW).issueAccessToken(PLAYER, FAMILY, ClientType.WEB, AUTH_TIME);
  }

  /** Runs the call and returns the code of the UnauthenticatedException it must throw. */
  private static ErrorCode rejection(ThrowingCallable call) {
    Throwable thrown = catchThrowable(call);
    assertThat(thrown).isInstanceOf(UnauthenticatedException.class);
    return ((UnauthenticatedException) thrown).code();
  }

  private static String encode(String text) {
    return Base64.getUrlEncoder().withoutPadding().encodeToString(text.getBytes(StandardCharsets.UTF_8));
  }

  /** Builds a token with any payload and a VALID signature, to test the claim checks. */
  private static String signedToken(String payloadJson) throws Exception {
    String unsigned = HEADER + "." + encode(payloadJson);
    Mac mac = Mac.getInstance("HmacSHA256");
    mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
    byte[] signature = mac.doFinal(unsigned.getBytes(StandardCharsets.US_ASCII));
    return unsigned + "." + Base64.getUrlEncoder().withoutPadding().encodeToString(signature);
  }

  private static String payloadOf(String token) {
    return new String(Base64.getUrlDecoder().decode(token.split("\\.")[1]), StandardCharsets.UTF_8);
  }

  // ------------------------------------------------------------------ tests

  @Test
  void anIssuedTokenVerifiesBackToTheSameClaims() {
    AccessClaims claims = issuerAt(NOW).verify(issue());

    assertThat(claims.playerId()).isEqualTo(PLAYER);
    assertThat(claims.sessionId()).isEqualTo(FAMILY);
    assertThat(claims.client()).isEqualTo(ClientType.WEB);
    assertThat(claims.authTime()).isEqualTo(AUTH_TIME);
  }

  @Test
  void theTokenIsAnHs256JwtWithIssuedAtAndExpiration() {
    String token = issue();
    String header = new String(Base64.getUrlDecoder().decode(token.split("\\.")[0]), StandardCharsets.UTF_8);
    String payload = payloadOf(token);

    assertThat(token.split("\\.")).hasSize(3);
    assertThat((String) JsonPath.read(header, "$.alg")).isEqualTo("HS256");
    assertThat(((Number) JsonPath.read(payload, "$.iat")).longValue()).isEqualTo(NOW.getEpochSecond());
    assertThat(((Number) JsonPath.read(payload, "$.exp")).longValue()).isEqualTo(NOW.plus(TTL).getEpochSecond());
    assertThat((String) JsonPath.read(payload, "$.cli")).isEqualTo("WEB");
    assertThat(issuerAt(NOW).accessTokenTtlSeconds()).isEqualTo(TTL.toSeconds());
  }

  @Test
  void theTokenIsValidUntilTheLastSecondAndExpiresAtTheTtl() {
    String token = issue();

    assertThat(issuerAt(NOW.plus(TTL).minusSeconds(1)).verify(token).playerId()).isEqualTo(PLAYER);
    assertThat(rejection(() -> issuerAt(NOW.plus(TTL)).verify(token))).isEqualTo(ErrorCode.TOKEN_EXPIRED);
    assertThat(rejection(() -> issuerAt(NOW.plus(Duration.ofDays(1))).verify(token))).isEqualTo(ErrorCode.TOKEN_EXPIRED);
  }

  @Test
  void aTokenSignedWithAnotherSecretIsRejected() {
    String foreign = issuerAt(NOW, "another-secret-that-is-also-32-characters-long")
        .issueAccessToken(PLAYER, FAMILY, ClientType.WEB, AUTH_TIME);

    assertThat(rejection(() -> issuerAt(NOW).verify(foreign))).isEqualTo(ErrorCode.INVALID_SESSION);
  }

  @Test
  void changingThePayloadBreaksTheSignature() {
    String token = issue();
    String[] parts = token.split("\\.");
    String otherPlayer = payloadOf(token).replace(PLAYER.toString(), UUID.randomUUID().toString());
    String tampered = parts[0] + "." + encode(otherPlayer) + "." + parts[2];

    assertThat(rejection(() -> issuerAt(NOW).verify(tampered))).isEqualTo(ErrorCode.INVALID_SESSION);
  }

  @Test
  void anotherAlgorithmInTheHeaderIsRejected() {
    String[] parts = issue().split("\\.");
    String none = encode("{\"alg\":\"none\",\"typ\":\"JWT\"}") + "." + parts[1] + "." + parts[2];

    assertThat(rejection(() -> issuerAt(NOW).verify(none))).isEqualTo(ErrorCode.INVALID_SESSION);
  }

  @ParameterizedTest
  @ValueSource(strings = {"", "abc", "a.b", "a.b.c.d", "not.a.jwt", "eyJ.eyJ.%%%"})
  void malformedTokensAreRejectedAsInvalidSession(String token) {
    assertThat(rejection(() -> issuerAt(NOW).verify(token))).isEqualTo(ErrorCode.INVALID_SESSION);
  }

  @Test
  void aValidSignatureWithBrokenClaimsIsStillRejected() throws Exception {
    long exp = NOW.plus(TTL).getEpochSecond();
    String unknownClient = signedToken("""
        {"sub":"%s","sid":"%s","cli":"PLAYSTATION","auth_time":%d,"iat":%d,"exp":%d}
        """.formatted(PLAYER, FAMILY, AUTH_TIME.getEpochSecond(), NOW.getEpochSecond(), exp));
    String playerIsNotAUuid = signedToken("""
        {"sub":"felc","sid":"%s","cli":"WEB","auth_time":%d,"iat":%d,"exp":%d}
        """.formatted(FAMILY, AUTH_TIME.getEpochSecond(), NOW.getEpochSecond(), exp));
    String withoutExpiration = signedToken("""
        {"sub":"%s","sid":"%s","cli":"WEB","auth_time":%d,"iat":%d}
        """.formatted(PLAYER, FAMILY, AUTH_TIME.getEpochSecond(), NOW.getEpochSecond()));

    assertThat(rejection(() -> issuerAt(NOW).verify(unknownClient))).isEqualTo(ErrorCode.INVALID_SESSION);
    assertThat(rejection(() -> issuerAt(NOW).verify(playerIsNotAUuid))).isEqualTo(ErrorCode.INVALID_SESSION);
    assertThat(rejection(() -> issuerAt(NOW).verify(withoutExpiration))).isEqualTo(ErrorCode.INVALID_SESSION);
  }

  @Test
  void theSignatureCheckDoesNotDependOnTheClient() {
    for (ClientType client : ClientType.values()) {
      String token = issuerAt(NOW).issueAccessToken(PLAYER, FAMILY, client, AUTH_TIME);
      assertThat(issuerAt(NOW).verify(token).client()).isEqualTo(client);
    }
  }
}