package mx.utch.tdimp.api.model;

/**
 * Operations with an attempt limit (README §10). Each one has its own maximum and window
 * in {@code tdimp.rate-limit.*} (application.yml).
 */
public enum RateLimitRule {
  /** Per IP + email. A successful login clears the counter. */
  LOGIN,
  /** Per IP: how many accounts one address can create. */
  REGISTER,
  /** Per player: password confirmation before deleting the account. A success clears the counter. */
  REAUTHENTICATE,
  /** Per IP: public form of the launch notice. */
  SUBSCRIPTIONS
}