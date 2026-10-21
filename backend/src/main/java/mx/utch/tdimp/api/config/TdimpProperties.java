package mx.utch.tdimp.api.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Typed view of the {@code tdimp.*} block in application.yml.
 * The application refuses to start if a required value is missing.
 */
@Validated
@ConfigurationProperties("tdimp")
public record TdimpProperties(@Valid @NotNull Security security) {

  public record Security(
      @NotBlank String jwtSecret,
      @NotNull Duration accessTokenTtl,
      @NotNull Duration refreshTokenTtl) {
  }
}