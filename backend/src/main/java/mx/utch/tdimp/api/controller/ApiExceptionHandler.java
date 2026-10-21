package mx.utch.tdimp.api.controller;

import java.net.URI;
import java.util.List;
import java.util.Map;
import mx.utch.tdimp.api.exception.ErrorCode;
import mx.utch.tdimp.api.exception.NotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * Turns every exception into {@code application/problem+json} (RFC 9457) with a stable {@code code}.
 * Domain exceptions never know about HTTP: the status is decided here.
 */
@RestControllerAdvice
class ApiExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);
  private static final String TYPE_BASE = "https://tdimp.app/problems/";

  // ----------------------------------------------------------- 400 Validation

  /** @Valid @RequestBody */
  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<ProblemDetail> invalidBody(MethodArgumentNotValidException ex) {
    var errors = ex.getBindingResult().getFieldErrors().stream()
        .map(e -> fieldError(e.getField(), String.valueOf(e.getCode()), e.getDefaultMessage()))
        .toList();
    log.warn("Validación rechazada (cuerpo): {}", errors);
    return validation(errors);
  }

  /** @Min, @Max, @Pattern... on @RequestParam and @PathVariable (built-in method validation). */
  @ExceptionHandler(HandlerMethodValidationException.class)
  ResponseEntity<ProblemDetail> invalidParameters(HandlerMethodValidationException ex) {
    var errors = ex.getParameterValidationResults().stream()
        .flatMap(result -> result.getResolvableErrors().stream()
            .map(error -> fieldError(result.getMethodParameter().getParameterName(), constraintName(error),
                error.getDefaultMessage())))
        .toList();
    log.warn("Validación rechazada (parámetros): {}", errors);
    return validation(errors);
  }

  @ExceptionHandler(MissingServletRequestParameterException.class)
  ResponseEntity<ProblemDetail> missingParameter(MissingServletRequestParameterException ex) {
    return validation(List.of(fieldError(ex.getParameterName(), "NotNull", "Required parameter.")));
  }

  @ExceptionHandler(MethodArgumentTypeMismatchException.class)
  ResponseEntity<ProblemDetail> typeMismatch(MethodArgumentTypeMismatchException ex) {
    log.warn("Parámetro con tipo inválido: {}", ex.getName());
    return validation(List.of(fieldError(ex.getName(), "TypeMismatch", "Invalid value.")));
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  ResponseEntity<ProblemDetail> unreadable(HttpMessageNotReadableException ex) {
    log.warn("Cuerpo JSON ilegible: {}", ex.getMostSpecificCause().getMessage());
    return validation(List.of(fieldError("body", "NotReadable", "Malformed JSON body.")));
  }

  // ------------------------------------------------------------ 404 Not found

  @ExceptionHandler(NotFoundException.class)
  ResponseEntity<ProblemDetail> notFound(NotFoundException ex) {
    return problem(HttpStatus.NOT_FOUND, "Not found", ErrorCode.NOT_FOUND, ex.getMessage());
  }

  /** A path that no controller handles (for example /api/v1/unknown). */
  @ExceptionHandler(NoResourceFoundException.class)
  ResponseEntity<ProblemDetail> noRoute(NoResourceFoundException ex) {
    return problem(HttpStatus.NOT_FOUND, "Not found", ErrorCode.NOT_FOUND, null);
  }

  // ---------------------------------------------------------------- 500 Error

  @ExceptionHandler(DataAccessException.class)
  ResponseEntity<ProblemDetail> database(DataAccessException ex) {
    String sqlState = ex.getMostSpecificCause() instanceof java.sql.SQLException sql ? sql.getSQLState() : "n/a";
    log.error("Error de base de datos (SQLState={}): {}", sqlState, ex.getMostSpecificCause().getMessage());
    return internalError();
  }

  /**
   * Last resort. Spring MVC's own 4xx exceptions (405 method not allowed, 415 media type...)
   * keep their status; anything else is a 500 and the client never sees a stack trace.
   */
  @ExceptionHandler(Exception.class)
  ResponseEntity<ProblemDetail> unexpected(Exception ex) {
    if (ex instanceof ErrorResponse framework && framework.getStatusCode().is4xxClientError()) {
      HttpStatus status = HttpStatus.valueOf(framework.getStatusCode().value());
      ErrorCode code = status == HttpStatus.NOT_FOUND ? ErrorCode.NOT_FOUND : ErrorCode.VALIDATION_FAILED;
      log.warn("Petición rechazada por Spring MVC ({}): {}", status.value(), ex.getMessage());
      return problem(status, status.getReasonPhrase(), code, framework.getBody().getDetail());
    }
    log.error("Error no controlado", ex);
    return internalError();
  }

  // ------------------------------------------------------------------ helpers

  private static ResponseEntity<ProblemDetail> internalError() {
    return problem(HttpStatus.INTERNAL_SERVER_ERROR, "Internal error", ErrorCode.INTERNAL_ERROR, null);
  }

  private static ResponseEntity<ProblemDetail> validation(List<Map<String, String>> errors) {
    var response = problem(HttpStatus.BAD_REQUEST, "Validation failed", ErrorCode.VALIDATION_FAILED,
        "One or more fields are invalid.");
    response.getBody().setProperty("errors", errors);
    return response;
  }

  static ResponseEntity<ProblemDetail> problem(HttpStatus status, String title, ErrorCode code, String detail) {
    ProblemDetail body = ProblemDetail.forStatus(status);
    body.setType(URI.create(TYPE_BASE + code.slug()));
    body.setTitle(title);
    body.setDetail(detail);
    body.setProperty("code", code.name());
    return ResponseEntity.status(status).contentType(MediaType.APPLICATION_PROBLEM_JSON).body(body);
  }

  private static Map<String, String> fieldError(String field, String code, String message) {
    return Map.of("field", field, "code", code, "message", message == null ? "Invalid value." : message);
  }

  /** The last resolvable code is the bare constraint name: "Min", "Max", "Pattern"... */
  private static String constraintName(MessageSourceResolvable error) {
    String[] codes = error.getCodes();
    return codes == null || codes.length == 0 ? "Invalid" : codes[codes.length - 1];
  }
}