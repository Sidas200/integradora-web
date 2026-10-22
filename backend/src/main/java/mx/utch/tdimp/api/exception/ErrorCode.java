package mx.utch.tdimp.api.exception;

/**
 * Stable error codes of the API. They are the same values as the {@code Problem.code}
 * enum in docs/api/openapi.yaml: each client turns them into a message in its own language.
 * Adding a value here means adding it to the contract too.
 */
public enum ErrorCode {
  VALIDATION_FAILED,
  INVALID_CREDENTIALS,
  TOKEN_EXPIRED,
  INVALID_SESSION,
  REAUTHENTICATION_REQUIRED,
  DELETION_WEB_ONLY,
  EMAIL_IN_USE,
  USERNAME_IN_USE,
  NOT_FOUND,
  VERSION_CONFLICT,
  TOO_MANY_ATTEMPTS,
  INTERNAL_ERROR;

  /** Slug used in the problem {@code type} URI: VERSION_CONFLICT → version-conflict. */
  public String slug() {
    return name().toLowerCase(java.util.Locale.ROOT).replace('_', '-');
  }
}