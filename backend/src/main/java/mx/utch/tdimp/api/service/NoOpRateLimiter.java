package mx.utch.tdimp.api.service;

import mx.utch.tdimp.api.model.RateLimitRule;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/**
 * Never limits. Used when {@code tdimp.rate-limit.enabled=false} (profile test): the integration tests
 * create many accounts from 127.0.0.1 and must not block each other. RateLimitIntegrationTest turns it back on.
 */
@Service
@ConditionalOnProperty(prefix = "tdimp.rate-limit", name = "enabled", havingValue = "false")
class NoOpRateLimiter implements RateLimiter {

  @Override
  public void acquire(RateLimitRule rule, String key) {
    // Without limit.
  }

  @Override
  public void reset(RateLimitRule rule, String key) {
    // Nothing to forget.
  }
}