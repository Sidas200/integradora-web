package mx.utch.tdimp.api.controller;

import java.net.URI;
import java.util.List;
import java.util.Map;
import mx.utch.tdimp.api.exception.ConflictException;
import mx.utch.tdimp.api.exception.InvalidParameterException;
import mx.utch.tdimp.api.exception.NotFoundException;
import mx.utch.tdimp.api.exception.UnauthenticatedException;
import mx.utch.tdimp.api.exception.VersionConflictException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
class ApiExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);
  private static final String TYPE_BASE = "https://tdimp.app/problems/";

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<ProblemDetail> invalidBody(MethodArgumentNotValidException ex) {
    var errors = ex.getBindingResult().getFieldErrors().stream()
        .map(e -> Map.of("field", e.getField(), "code", String.valueOf(e.getCode()),
            "message", String.valueOf(e.getDefaultMessage())))
        .toList();
    log.warn("Validación rechazada: {}", errors);
    return validation(errors);
  }

  @ExceptionHandler(InvalidParameterException.class)
  ResponseEntity<ProblemDetail> invalidParameter(InvalidParameterException ex) {
    log.warn("Parámetro inválido: {} ({})", ex.field(), ex.getMessage());
    return validation(List.of(Map.of("field", ex.field(), "code", ex.code(), "message", ex.getMessage())));
  }

  @ExceptionHandler(MethodArgumentTypeMismatchException.class)
  ResponseEntity<ProblemDetail> typeMismatch(MethodArgumentTypeMismatchException ex) {
    log.warn("Parámetro con tipo inválido: {}", ex.getName());
    return validation(List.of(Map.of("field", ex.getName(), "code", "TypeMismatch", "message", "Invalid value.")));
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  ResponseEntity<ProblemDetail> unreadable(HttpMessageNotReadableException ex) {
    log.warn("Cuerpo JSON ilegible: {}", ex.getMostSpecificCause().getMessage());
    return validation(List.of(Map.of("field", "body", "code", "NotReadable", "message", "Malformed JSON body.")));
  }

  @ExceptionHandler(NotFoundException.class)
  ResponseEntity<ProblemDetail> notFound(NotFoundException ex) {
    return problem(HttpStatus.NOT_FOUND, "Not found", "NOT_FOUND", ex.getMessage());
  }

  @ExceptionHandler(UnauthenticatedException.class)
  ResponseEntity<ProblemDetail> unauthenticated(UnauthenticatedException ex) {
    log.info("401 {}: {}", ex.code(), ex.getMessage());
    var response = problem(HttpStatus.UNAUTHORIZED, "Unauthenticated", ex.code(), ex.getMessage());
    response.getBody().setType(URI.create(TYPE_BASE + "unauthenticated"));
    return response;
  }

  @ExceptionHandler(ConflictException.class)
  ResponseEntity<ProblemDetail> conflict(ConflictException ex) {
    var response = problem(HttpStatus.CONFLICT, "Already exists", ex.code(), null);
    response.getBody().setType(URI.create(TYPE_BASE + "conflict"));
    response.getBody().setProperty("errors",
        List.of(Map.of("field", ex.field(), "code", "IN_USE", "message", ex.getMessage())));
    return response;
  }

  @ExceptionHandler(VersionConflictException.class)
  ResponseEntity<ProblemDetail> versionConflict(VersionConflictException ex) {
    var response = problem(HttpStatus.CONFLICT, "Version conflict", "VERSION_CONFLICT", ex.getMessage());
    response.getBody().setProperty("serverVersion", ex.serverVersion());
    response.getBody().setProperty("serverUpdatedAt", ex.serverUpdatedAt());
    return response;
  }

  @ExceptionHandler(DataAccessException.class)
  ResponseEntity<ProblemDetail> database(DataAccessException ex) {
    String sqlState = ex.getMostSpecificCause() instanceof java.sql.SQLException sql ? sql.getSQLState() : "n/a";
    log.error("Error de base de datos (SQLState={}): {}", sqlState, ex.getMostSpecificCause().getMessage());
    return problem(HttpStatus.INTERNAL_SERVER_ERROR, "Internal error", "INTERNAL_ERROR", null);
  }

  private static ResponseEntity<ProblemDetail> validation(List<Map<String, String>> errors) {
    var response = problem(HttpStatus.BAD_REQUEST, "Validation failed", "VALIDATION_FAILED", null);
    response.getBody().setProperty("errors", errors);
    return response;
  }

  private static ResponseEntity<ProblemDetail> problem(HttpStatus status, String title, String code, String detail) {
    ProblemDetail body = ProblemDetail.forStatus(status);
    body.setType(URI.create(TYPE_BASE + code.toLowerCase().replace('_', '-')));
    body.setTitle(title);
    body.setDetail(detail);
    body.setProperty("code", code);
    return ResponseEntity.status(status).contentType(MediaType.APPLICATION_PROBLEM_JSON).body(body);
  }
}
