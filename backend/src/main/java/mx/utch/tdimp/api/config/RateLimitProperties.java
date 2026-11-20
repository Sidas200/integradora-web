package mx.utch.tdimp.api.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.Duration;
import mx.utch.tdimp.api.model.RateLimitRule;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Typed view of {@code tdimp.rate-limit.*}. With {@code enabled: false} (profile test) the API uses
 * NoOpRateLimiter; the limits are still required so every profile starts with the same validation.
 */
@Validated
@ConfigurationProperties("tdimp.rate-limit")
public record RateLimitProperties(
    boolean enabled,
    @Valid @NotNull Limit login,
    @Valid @NotNull Limit register,
    @Valid @NotNull Limit reauthenticate,
    @Valid @NotNull Limit subscriptions) {

  /** {@code maxAttempts} inside each {@code window}; the attempt after the last one gets 429. */
  public record Limit(@Min(1) int maxAttempts, @NotNull Duration window) {
  }

  public Limit limitFor(RateLimitRule rule) {
    return switch (rule) {
      case LOGIN -> login;
      case REGISTER -> register;
      case REAUTHENTICATE -> reauthenticate;
      case SUBSCRIPTIONS -> subscriptions;
    };
  }
}