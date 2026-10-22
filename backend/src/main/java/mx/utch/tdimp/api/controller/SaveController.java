package mx.utch.tdimp.api.controller;

import jakarta.validation.Valid;
import jakarta.validation.Validator;
import java.util.List;
import mx.utch.tdimp.api.dto.BatchResultDto;
import mx.utch.tdimp.api.dto.EventInput;
import mx.utch.tdimp.api.dto.PlaySessionInput;
import mx.utch.tdimp.api.dto.SaveAcceptedDto;
import mx.utch.tdimp.api.dto.SaveDataDto;
import mx.utch.tdimp.api.dto.SaveDetailDto;
import mx.utch.tdimp.api.dto.SaveSummaryDto;
import mx.utch.tdimp.api.exception.InvalidParameterException;
import mx.utch.tdimp.api.service.AccessClaims;
import mx.utch.tdimp.api.service.SaveService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Ranuras de guardado: la web las lee; solo el juego las escribe.
@RestController
@RequestMapping("/api/v1/account/saves")
class SaveController {

  private static final int MAX_SESSIONS = 50;
  private static final int MAX_EVENTS = 100;

  private final SaveService saves;
  private final Validator validator;

  SaveController(SaveService saves, Validator validator) {
    this.saves = saves;
    this.validator = validator;
  }

  @GetMapping
  ResponseEntity<List<SaveSummaryDto>> list(AccessClaims claims) {
    return AccountController.privately(saves.list(claims.playerId()));
  }

  @GetMapping("/{slot}")
  ResponseEntity<SaveDetailDto> detail(AccessClaims claims, @PathVariable int slot) {
    return AccountController.privately(saves.detail(claims.playerId(), Slots.check(slot)));
  }

  @GetMapping("/{slot}/data")
  ResponseEntity<SaveDataDto> download(AccessClaims claims, @PathVariable int slot) {
    return AccountController.privately(saves.download(claims.playerId(), Slots.check(slot)));
  }

  @PutMapping("/{slot}/data")
  ResponseEntity<SaveAcceptedDto> upload(AccessClaims claims, @PathVariable int slot,
                                         @Valid @RequestBody SaveDataDto data) {
    return AccountController.privately(saves.upload(claims.playerId(), Slots.check(slot), data));
  }

  @PostMapping("/{slot}/sessions")
  ResponseEntity<BatchResultDto> sessions(AccessClaims claims, @PathVariable int slot,
                                          @RequestBody List<PlaySessionInput> sessions) {
    validateBatch(sessions, MAX_SESSIONS);
    return AccountController.privately(saves.uploadSessions(claims.playerId(), Slots.check(slot), sessions));
  }

  @PostMapping("/{slot}/events")
  ResponseEntity<BatchResultDto> events(AccessClaims claims, @PathVariable int slot,
                                        @RequestBody List<EventInput> events) {
    validateBatch(events, MAX_EVENTS);
    return AccountController.privately(saves.uploadEvents(claims.playerId(), Slots.check(slot), events));
  }

  // @Valid no valida los elementos de una lista en el cuerpo: se hace aquí, con el índice en el campo.
  private <T> void validateBatch(List<T> batch, int max) {
    if (batch == null || batch.isEmpty() || batch.size() > max) {
      throw new InvalidParameterException("body", "Size", "Must contain between 1 and " + max + " elements.");
    }
    for (int i = 0; i < batch.size(); i++) {
      if (batch.get(i) == null) {
        throw new InvalidParameterException("[" + i + "]", "NotNull", "Must not be null.");
      }
      var violation = validator.validate(batch.get(i)).stream().findFirst();
      if (violation.isPresent()) {
        var v = violation.get();
        String code = v.getConstraintDescriptor().getAnnotation().annotationType().getSimpleName();
        throw new InvalidParameterException("[" + i + "]." + v.getPropertyPath(), code, v.getMessage());
      }
    }
  }
}
