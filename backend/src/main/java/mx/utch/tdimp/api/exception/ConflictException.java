package mx.utch.tdimp.api.exception;

// 409 por un valor único repetido: EMAIL_IN_USE o USERNAME_IN_USE.
public class ConflictException extends RuntimeException {

  private final String code;
  private final String field;

  public ConflictException(String code, String field, String message) {
    super(message);
    this.code = code;
    this.field = field;
  }

  public String code() {
    return code;
  }

  public String field() {
    return field;
  }
}
