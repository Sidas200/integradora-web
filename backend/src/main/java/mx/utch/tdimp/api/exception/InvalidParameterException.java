package mx.utch.tdimp.api.exception;

public class InvalidParameterException extends RuntimeException {

  private final String field;
  private final String code;

  public InvalidParameterException(String field, String code, String message) {
    super(message);
    this.field = field;
    this.code = code;
  }

  public String field() {
    return field;
  }

  public String code() {
    return code;
  }
}
