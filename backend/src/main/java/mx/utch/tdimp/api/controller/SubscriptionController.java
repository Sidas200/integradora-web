package mx.utch.tdimp.api.controller;

import jakarta.validation.Valid;
import mx.utch.tdimp.api.dto.SubscriptionRequest;
import mx.utch.tdimp.api.service.SubscriptionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/subscriptions")
class SubscriptionController {

  private final SubscriptionService subscriptions;

  SubscriptionController(SubscriptionService subscriptions) {
    this.subscriptions = subscriptions;
  }

  @PostMapping
  ResponseEntity<Void> subscribe(@Valid @RequestBody SubscriptionRequest request) {
    subscriptions.subscribe(request);
    return ResponseEntity.accepted().build();
  }
}
