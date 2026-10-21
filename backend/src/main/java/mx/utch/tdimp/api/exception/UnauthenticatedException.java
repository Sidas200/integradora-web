package mx.utch.tdimp.api.exception;

// 401 con un code estable: INVALID_CREDENTIALS, TOKEN_EXPIRED o INVALID_SESSION.
public class UnauthenticatedException extends RuntimeException {

  private final String code;

  public UnauthenticatedException(String code, String message) {
    super(message);
    this.code = code;
  }

  public String code() {
    return code;
  }
}
