package mx.utch.tdimp.api.exception;

import java.time.Duration;

// 429 TOO_MANY_ATTEMPTS: se pasó el límite de intentos; retryAfter dice cuánto falta para volver a intentar.
public class TooManyAttemptsException extends RuntimeException {

  private final Duration retryAfter;

  public TooManyAttemptsException(Duration retryAfter) {
    super("Too many attempts. Try again later.");
    this.retryAfter = retryAfter;
  }

  public Duration retryAfter() {
    return retryAfter;
  }

  /** Value of the Retry-After header: whole seconds, rounded up and never less than 1. */
  public long retryAfterSeconds() {
    long seconds = retryAfter.toSeconds() + (retryAfter.toNanosPart() > 0 ? 1 : 0);
    return Math.max(1, seconds);
  }
}