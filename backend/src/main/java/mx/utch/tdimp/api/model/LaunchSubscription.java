package mx.utch.tdimp.api.model;

import java.time.OffsetDateTime;

public record LaunchSubscription(
    String email,
    String language,
    SubscriptionSource source,
    OffsetDateTime consentedAt) {
}
