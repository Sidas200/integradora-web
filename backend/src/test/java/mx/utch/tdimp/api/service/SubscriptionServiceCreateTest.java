package mx.utch.tdimp.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import mx.utch.tdimp.api.dto.SubscriptionRequest;
import mx.utch.tdimp.api.model.LaunchSubscription;
import mx.utch.tdimp.api.model.SubscriptionSource;
import mx.utch.tdimp.api.repository.SubscriptionWriter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class SubscriptionServiceCreateTest {

    private static final Instant AHORA = Instant.parse("2026-11-04T18:00:00Z");

    @InjectMocks
    private SubscriptionServiceImpl subscriptionService;
    @Mock
    private SubscriptionWriter subscriptionWriter;
    @Spy
    private Clock clock = Clock.fixed(AHORA, ZoneOffset.UTC);

    @Test
    @DisplayName("Debe crear una nueva suscripción")
    public void createNewSubscription() {
        SubscriptionRequest request = new SubscriptionRequest("tarja@gmail.com", "es", true);

        when(subscriptionWriter.insertIfAbsent(any(LaunchSubscription.class))).thenReturn(true);

        subscriptionService.subscribe(request);

        ArgumentCaptor<LaunchSubscription> captor = ArgumentCaptor.forClass(LaunchSubscription.class);
        verify(subscriptionWriter).insertIfAbsent(captor.capture());
        LaunchSubscription subscription = captor.getValue();

        assertThat(subscription).isNotNull();
        assertThat(subscription.email()).isEqualTo("tarja@gmail.com");
        assertThat(subscription.language()).isEqualTo("es");
        assertThat(subscription.source()).isEqualTo(SubscriptionSource.LANDING);
        assertThat(subscription.consentedAt()).isEqualTo(OffsetDateTime.ofInstant(AHORA, ZoneOffset.UTC));
    }
}
