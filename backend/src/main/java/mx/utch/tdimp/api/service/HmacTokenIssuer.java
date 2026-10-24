package mx.utch.tdimp.api.service;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import mx.utch.tdimp.api.config.TdimpProperties;
import mx.utch.tdimp.api.exception.ErrorCode;
import mx.utch.tdimp.api.exception.UnauthenticatedException;
import mx.utch.tdimp.api.service.AccessClaims;
import mx.utch.tdimp.api.model.ClientType;
import org.springframework.stereotype.Service;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

// JWT HS256 firmado con JWT_SECRET. Claims: sub, sid, cli, auth_time, iat, exp.
@Service
class HmacTokenIssuer implements TokenIssuer {

  private static final String HEADER = encode("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
  private static final TypeReference<Map<String, Object>> CLAIMS = new TypeReference<>() { };
  private static final Base64.Decoder DECODER = Base64.getUrlDecoder();

  private final SecretKeySpec key;
  private final long ttlSeconds;
  private final JsonMapper json;
  private final Clock clock = Clock.systemUTC();

  HmacTokenIssuer(TdimpProperties properties, JsonMapper json) {
    this.key = new SecretKeySpec(properties.security().jwtSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    this.ttlSeconds = properties.security().accessTokenTtl().toSeconds();
    this.json = json;
  }

  @Override
  public String issueAccessToken(UUID playerId, UUID sessionId, ClientType client, Instant authTime) {
    long now = clock.instant().getEpochSecond();
    Map<String, Object> claims = new LinkedHashMap<>();
    claims.put("sub", playerId.toString());
    claims.put("sid", sessionId.toString());
    claims.put("cli", client.name());
    claims.put("auth_time", authTime.getEpochSecond());
    claims.put("iat", now);
    claims.put("exp", now + ttlSeconds);
    String unsigned = HEADER + "." + encode(json.writeValueAsBytes(claims));
    return unsigned + "." + encode(sign(unsigned));
  }

  @Override
  public long accessTokenTtlSeconds() {
    return ttlSeconds;
  }

  @Override
  public AccessClaims verify(String token) {
    String[] parts = token.split("\\.");
    if (parts.length != 3 || !parts[0].equals(HEADER)) {
      throw invalid();
    }
    byte[] signature;
    Map<String, Object> claims;
    try {
      signature = DECODER.decode(parts[2]);
      claims = json.readValue(DECODER.decode(parts[1]), CLAIMS);
    } catch (RuntimeException ex) {
      throw invalid();
    }
    if (!MessageDigest.isEqual(signature, sign(parts[0] + "." + parts[1]))) {
      throw invalid();
    }
    try {
      long exp = ((Number) claims.get("exp")).longValue();
      if (clock.instant().getEpochSecond() >= exp) {
        throw new UnauthenticatedException(ErrorCode.TOKEN_EXPIRED, "The access token has expired.");
      }
      return new AccessClaims(
          UUID.fromString((String) claims.get("sub")),
          UUID.fromString((String) claims.get("sid")),
          ClientType.valueOf((String) claims.get("cli")),
          Instant.ofEpochSecond(((Number) claims.get("auth_time")).longValue()));
    } catch (ClassCastException | NullPointerException | IllegalArgumentException ex) {
      throw invalid();
    }
  }

  private byte[] sign(String data) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(key);
      return mac.doFinal(data.getBytes(StandardCharsets.US_ASCII));
    } catch (GeneralSecurityException ex) {
      throw new IllegalStateException("HmacSHA256 unavailable", ex);
    }
  }

  private static String encode(byte[] bytes) {
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }

  private static UnauthenticatedException invalid() {
    return new UnauthenticatedException(ErrorCode.INVALID_SESSION, "The access token is not valid.");
  }
}
