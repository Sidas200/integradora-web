package mx.utch.tdimp.api.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import java.time.OffsetDateTime;
import mx.utch.tdimp.api.exception.ConflictException;
import mx.utch.tdimp.api.exception.ErrorCode;
import mx.utch.tdimp.api.exception.ForbiddenException;
import mx.utch.tdimp.api.exception.InvalidParameterException;
import mx.utch.tdimp.api.exception.NotFoundException;
import mx.utch.tdimp.api.exception.UnauthenticatedException;
import mx.utch.tdimp.api.exception.VersionConflictException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Every exception becomes application/problem+json with a stable code (RFC 9457).
 * A small controller that only exists in this test throws each kind of exception.
 */
@WebMvcTest(ApiExceptionHandlerTest.ThrowingController.class)
@Import(ApiExceptionHandlerTest.ThrowingController.class)
class ApiExceptionHandlerTest {

  @Autowired
  MockMvc mvc;

  record Body(@NotBlank String name) {
  }

  /** Test-only endpoints under /test-errors: one per exception the handler knows. */
  @RestController
  @RequestMapping("/test-errors")
  static class ThrowingController {

    @GetMapping("/not-found")
    void notFound() {
      throw new NotFoundException("Slot 2 has no save.");
    }

    @GetMapping("/conflict")
    void conflict() {
      throw new ConflictException(ErrorCode.EMAIL_IN_USE, "email", "Email is already registered.");
    }

    @GetMapping("/version-conflict")
    void versionConflict() {
      throw new VersionConflictException(3, OffsetDateTime.parse("2026-11-09T18:00:00Z"));
    }

    @GetMapping("/forbidden")
    void forbidden() {
      throw new ForbiddenException(ErrorCode.DELETION_WEB_ONLY, "The account can only be deleted from the web.");
    }

    @GetMapping("/unauthenticated")
    void unauthenticated() {
      throw new UnauthenticatedException(ErrorCode.TOKEN_EXPIRED, "The access token has expired.");
    }

    @GetMapping("/invalid-parameter")
    void invalidParameter() {
      throw new InvalidParameterException("slot", "Range", "Must be between 1 and 3.");
    }

    @GetMapping("/database")
    void database() {
      throw new DataIntegrityViolationException("duplicate key value violates unique constraint \"secret_index\"");
    }

    @GetMapping("/unexpected")
    void unexpected() {
      throw new IllegalStateException("password=hunter2 should never reach the client");
    }

    @PostMapping("/body")
    String body(@Valid @RequestBody Body body) {
      return body.name();
    }

    @GetMapping("/params")
    int params(@RequestParam int required, @RequestParam(defaultValue = "1") @Max(5) int small) {
      return required + small;
    }
  }

  // ------------------------------------------------------------- 4xx of the domain

  @Test
  void notFoundIs404() throws Exception {
    mvc.perform(get("/test-errors/not-found"))
        .andExpect(status().isNotFound())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
        .andExpect(jsonPath("$.status").value(404))
        .andExpect(jsonPath("$.code").value("NOT_FOUND"))
        .andExpect(jsonPath("$.type").value("https://tdimp.app/problems/not-found"))
        .andExpect(jsonPath("$.detail").value("Slot 2 has no save."));
  }

  @Test
  void aRepeatedValueIs409WithTheField() throws Exception {
    mvc.perform(get("/test-errors/conflict"))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.code").value("EMAIL_IN_USE"))
        .andExpect(jsonPath("$.type").value("https://tdimp.app/problems/conflict"))
        .andExpect(jsonPath("$.errors[0].field").value("email"))
        .andExpect(jsonPath("$.errors[0].code").value("IN_USE"));
  }

  @Test
  void aVersionConflictIs409WithWhatTheServerHas() throws Exception {
    mvc.perform(get("/test-errors/version-conflict"))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.code").value("VERSION_CONFLICT"))
        .andExpect(jsonPath("$.serverVersion").value(3))
        .andExpect(jsonPath("$.serverUpdatedAt").isNotEmpty());
  }

  @Test
  void forbiddenIs403() throws Exception {
    mvc.perform(get("/test-errors/forbidden"))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("DELETION_WEB_ONLY"))
        .andExpect(jsonPath("$.type").value("https://tdimp.app/problems/operation-not-allowed"));
  }

  @Test
  void unauthenticatedIs401WithItsCode() throws Exception {
    mvc.perform(get("/test-errors/unauthenticated"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("TOKEN_EXPIRED"))
        .andExpect(jsonPath("$.type").value("https://tdimp.app/problems/unauthenticated"));
  }

  // ------------------------------------------------------------------ 400 validation

  @Test
  void aServiceRuleIsAValidationProblem() throws Exception {
    mvc.perform(get("/test-errors/invalid-parameter"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
        .andExpect(jsonPath("$.errors[0].field").value("slot"))
        .andExpect(jsonPath("$.errors[0].code").value("Range"))
        .andExpect(jsonPath("$.errors[0].message").value("Must be between 1 and 3."));
  }

  @Test
  void anInvalidBodyListsEachField() throws Exception {
    mvc.perform(post("/test-errors/body").contentType(MediaType.APPLICATION_JSON).content("{ \"name\": \"\" }"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
        .andExpect(jsonPath("$.errors[0].field").value("name"))
        .andExpect(jsonPath("$.errors[0].code").value("NotBlank"));
  }

  @Test
  void aMalformedJsonBodyIsAValidationProblemOnTheBody() throws Exception {
    mvc.perform(post("/test-errors/body").contentType(MediaType.APPLICATION_JSON).content("{ \"name\": "))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors[0].field").value("body"))
        .andExpect(jsonPath("$.errors[0].code").value("NotReadable"));
  }

  @Test
  void parametersThatAreMissingOfAnotherTypeOrOutOfRangeAreValidationProblems() throws Exception {
    mvc.perform(get("/test-errors/params"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors[0].field").value("required"))
        .andExpect(jsonPath("$.errors[0].code").value("NotNull"));

    mvc.perform(get("/test-errors/params").param("required", "abc"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors[0].field").value("required"))
        .andExpect(jsonPath("$.errors[0].code").value("TypeMismatch"));

    mvc.perform(get("/test-errors/params").param("required", "1").param("small", "9"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors[0].field").value("small"))
        .andExpect(jsonPath("$.errors[0].code").value("Max"));

    mvc.perform(get("/test-errors/params").param("required", "1").param("small", "2"))
        .andExpect(status().isOk());
  }

  // --------------------------------------------------------------- Spring MVC 4xx

  @Test
  void aWrongHttpMethodKeepsItsStatus() throws Exception {
    mvc.perform(post("/test-errors/not-found"))
        .andExpect(status().isMethodNotAllowed())
        .andExpect(jsonPath("$.status").value(405))
        .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
  }

  @Test
  void anUnknownRouteIsNotFound() throws Exception {
    mvc.perform(get("/test-errors/does-not-exist"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("NOT_FOUND"));
  }

  // --------------------------------------------------------------------- 500

  @Test
  void databaseErrorsAre500WithoutSqlDetails() throws Exception {
    MvcResult result = mvc.perform(get("/test-errors/database"))
        .andExpect(status().isInternalServerError())
        .andExpect(jsonPath("$.code").value("INTERNAL_ERROR"))
        .andReturn();

    assertThat(result.getResponse().getContentAsString()).doesNotContain("secret_index").doesNotContain("duplicate key");
  }

  @Test
  void anyOtherErrorIs500AndNeverShowsTheMessage() throws Exception {
    MvcResult result = mvc.perform(get("/test-errors/unexpected"))
        .andExpect(status().isInternalServerError())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
        .andExpect(jsonPath("$.code").value("INTERNAL_ERROR"))
        .andReturn();

    assertThat(result.getResponse().getContentAsString()).doesNotContain("hunter2");
  }
}