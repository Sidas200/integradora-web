package mx.utch.tdimp.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import mx.utch.tdimp.api.dto.SubscriptionRequest;
import mx.utch.tdimp.api.model.LaunchSubscription;
import mx.utch.tdimp.api.repository.SubscriptionWriter;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

/**
 * Cases of the launch notice that SubscriptionServiceCreateTest (evidence of the unit-testing
 * practice) does not cover: email normalization, repeated subscriptions and very short emails.
 */
class SubscriptionServiceImplTest {

  private final SubscriptionWriter writer = mock(SubscriptionWriter.class);
  private final SubscriptionService service =
      new SubscriptionServiceImpl(writer, Clock.fixed(Instant.parse("2026-11-09T18:00:00Z"), ZoneOffset.UTC));

  private String storedEmail() {
    ArgumentCaptor<LaunchSubscription> captor = ArgumentCaptor.forClass(LaunchSubscription.class);
    verify(writer).insertIfAbsent(captor.capture());
    return captor.getValue().email();
  }

  @Test
  void theEmailIsTrimmedAndLowercased() {
    when(writer.insertIfAbsent(any())).thenReturn(true);

    service.subscribe(new SubscriptionRequest("  Felc@Example.COM ", "es", true));

    assertThat(storedEmail()).isEqualTo("felc@example.com");
  }

  @Test
  void subscribingAgainIsNotAnError() {
    when(writer.insertIfAbsent(any())).thenReturn(false);

    assertThatCode(() -> service.subscribe(new SubscriptionRequest("felc@example.com", "en", true)))
        .doesNotThrowAnyException();
    assertThat(storedEmail()).isEqualTo("felc@example.com");
  }

  @Test
  void aOneLetterEmailDoesNotBreakTheMaskedLog() {
    when(writer.insertIfAbsent(any())).thenReturn(true);

    assertThatCode(() -> service.subscribe(new SubscriptionRequest("a@b.mx", "es", true)))
        .doesNotThrowAnyException();
    assertThat(storedEmail()).isEqualTo("a@b.mx");
  }
}