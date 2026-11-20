package mx.utch.tdimp.api.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import mx.utch.tdimp.api.dto.SubscriptionRequest;
import mx.utch.tdimp.api.model.RateLimitRule;
import mx.utch.tdimp.api.service.RateLimiter;
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
  private final RateLimiter limiter;

  SubscriptionController(SubscriptionService subscriptions, RateLimiter limiter) {
    this.subscriptions = subscriptions;
    this.limiter = limiter;
  }

  // Formulario público: límite por IP (tdimp.rate-limit.subscriptions).
  @PostMapping
  ResponseEntity<Void> subscribe(@Valid @RequestBody SubscriptionRequest request, HttpServletRequest httpRequest) {
    limiter.acquire(RateLimitRule.SUBSCRIPTIONS, ClientIp.of(httpRequest));
    subscriptions.subscribe(request);
    return ResponseEntity.accepted().build();
  }
}