package mx.utch.tdimp.api.exception;

// 403: hay sesión, pero la operación no se permite desde ese cliente (DELETION_WEB_ONLY).
public class ForbiddenException extends RuntimeException {

  private final ErrorCode code;

  public ForbiddenException(ErrorCode code, String message) {
    super(message);
    this.code = code;
  }

  public ErrorCode code() {
    return code;
  }
}