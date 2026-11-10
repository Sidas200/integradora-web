package mx.utch.tdimp.api.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import mx.utch.tdimp.api.config.RateLimitProperties;
import mx.utch.tdimp.api.exception.TooManyAttemptsException;
import mx.utch.tdimp.api.model.RateLimitRule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/**
 * Fixed window per rule and key, kept in memory. Enough for a single API instance (Render free plan);
 * with several instances each one would count on its own and this should move to the database or Redis.
 */
@Service
@ConditionalOnProperty(prefix = "tdimp.rate-limit", name = "enabled", havingValue = "true", matchIfMissing = true)
class InMemoryRateLimiter implements RateLimiter {

  private static final Logger log = LoggerFactory.getLogger(InMemoryRateLimiter.class);
  // Above this many keys the expired windows are removed, so the map cannot grow without limit.
  static final int PURGE_THRESHOLD = 10_000;

  private final RateLimitProperties properties;
  private final Clock clock;
  private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

  /** Attempts counted since the window started; the window ends at {@code resetAt}. */
  private record Window(Instant resetAt, int attempts) {
  }

  InMemoryRateLimiter(RateLimitProperties properties, Clock clock) {
    this.properties = properties;
    this.clock = clock;
  }

  @Override
  public void acquire(RateLimitRule rule, String key) {
    RateLimitProperties.Limit limit = properties.limitFor(rule);
    Instant now = clock.instant();
    if (windows.size() > PURGE_THRESHOLD) {
      purgeExpired(now);
    }
    // compute is atomic per key: two simultaneous attempts are both counted.
    Window window = windows.compute(id(rule, key), (id, current) ->
        current == null || !now.isBefore(current.resetAt())
            ? new Window(now.plus(limit.window()), 1)
            : new Window(current.resetAt(), current.attempts() + 1));
    if (window.attempts() > limit.maxAttempts()) {
      Duration retryAfter = Duration.between(now, window.resetAt());
      log.warn("Límite de intentos alcanzado: regla={} intento={} de {} (reintentar en {} s)",
          rule, window.attempts(), limit.maxAttempts(), retryAfter.toSeconds());
      throw new TooManyAttemptsException(retryAfter);
    }
  }

  @Override
  public void reset(RateLimitRule rule, String key) {
    windows.remove(id(rule, key));
  }

  /** Number of keys being tracked; only for the tests of the purge. */
  int trackedKeys() {
    return windows.size();
  }

  private void purgeExpired(Instant now) {
    windows.values().removeIf(w -> !now.isBefore(w.resetAt()));
  }

  private static String id(RateLimitRule rule, String key) {
    return rule.name() + '|' + key;
  }
}