package mx.utch.tdimp.api.exception;

// 400 VALIDATION_FAILED por una regla que no cabe en una anotación (ids del catálogo, orden de fechas...).
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
