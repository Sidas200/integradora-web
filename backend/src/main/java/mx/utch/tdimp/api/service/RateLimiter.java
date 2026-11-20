package mx.utch.tdimp.api.service;

import mx.utch.tdimp.api.model.RateLimitRule;

/**
 * Attempt limit for login, register, reauthentication and the public launch-notice form (README §10).
 * The controllers depend on this interface; the implementation is chosen by {@code tdimp.rate-limit.enabled}.
 */
public interface RateLimiter {

  /**
   * Counts one attempt of {@code key} under {@code rule}.
   * Throws TooManyAttemptsException (429) when the limit of the current window was already reached.
   */
  void acquire(RateLimitRule rule, String key);

  /** Forgets the attempts of {@code key} (after a successful login, for example). */
  void reset(RateLimitRule rule, String key);
}