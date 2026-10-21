package mx.utch.tdimp.api.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("tdimp.security")
public record SecurityProperties(String jwtSecret, Duration accessTokenTtl, Duration refreshTokenTtl) {

  public SecurityProperties {
    if (jwtSecret == null || jwtSecret.length() < 32) {
      throw new IllegalStateException("JWT_SECRET must have at least 32 characters.");
    }
  }
}
