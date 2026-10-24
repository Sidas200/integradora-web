package mx.utch.tdimp.api.service;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.Locale;
import mx.utch.tdimp.api.dto.SubscriptionRequest;
import mx.utch.tdimp.api.model.LaunchSubscription;
import mx.utch.tdimp.api.model.SubscriptionSource;
import mx.utch.tdimp.api.repository.SubscriptionWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class SubscriptionServiceImpl implements SubscriptionService {

  private static final Logger log = LoggerFactory.getLogger(SubscriptionServiceImpl.class);

  private final SubscriptionWriter writer;
  private final Clock clock;

  SubscriptionServiceImpl(SubscriptionWriter writer, Clock clock) {
    this.writer = writer;
    this.clock = clock;
  }

  @Override
  @Transactional
  public void subscribe(SubscriptionRequest request) {
    String email = request.email().trim().toLowerCase(Locale.ROOT);
    log.info("Payload POST /subscriptions recibido: email={}, language={}, consent={}",
        mask(email), request.language(), request.consent());

    boolean created = writer.insertIfAbsent(new LaunchSubscription(
        email, request.language(), SubscriptionSource.LANDING, OffsetDateTime.now(clock)));

    log.info("Suscripción {} ({})", created ? "registrada" : "ya existía, sin cambios", mask(email));
  }

  private static String mask(String email) {
    int at = email.indexOf('@');
    return at <= 1 ? "***" + email.substring(Math.max(at, 0)) : email.charAt(0) + "***" + email.substring(at);
  }
}