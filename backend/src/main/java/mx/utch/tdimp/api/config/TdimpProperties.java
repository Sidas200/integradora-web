package mx.utch.tdimp.api.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
      @NotBlank @Size(min = 32, message = "JWT_SECRET must have at least 32 characters.") String jwtSecret,
      @NotNull Duration accessTokenTtl,
      @NotNull Duration refreshTokenTtl) {
  }
}