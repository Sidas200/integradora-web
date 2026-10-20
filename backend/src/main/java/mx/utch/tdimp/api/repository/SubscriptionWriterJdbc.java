package mx.utch.tdimp.api.repository;

import mx.utch.tdimp.api.config.QueryTimer;
import mx.utch.tdimp.api.model.LaunchSubscription;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
class SubscriptionWriterJdbc implements SubscriptionWriter {

  private static final Logger log = LoggerFactory.getLogger(SubscriptionWriterJdbc.class);

  private final JdbcClient jdbc;

  SubscriptionWriterJdbc(JdbcClient jdbc) {
    this.jdbc = jdbc;
  }

  @Override
  public boolean insertIfAbsent(LaunchSubscription subscription) {
    var timed = QueryTimer.time(() -> jdbc.sql("""
            insert into launch_subscriptions (email, language, source, consented_at)
            values (:email, :language, :source, :consentedAt)
            on conflict (email) do nothing
            """)
        .param("email", subscription.email())
        .param("language", subscription.language())
        .param("source", subscription.source().name())
        .param("consentedAt", subscription.consentedAt())
        .update());
    int rows = timed.value();
    log.debug("BD INSERT launch_subscriptions -> filas afectadas={} ({}) en {} ms", rows,
        rows == 1 ? "INSERT 0 1: registro nuevo" : "INSERT 0 0: el correo ya existía, ON CONFLICT DO NOTHING",
        String.format("%.1f", timed.millis()));
    return rows == 1;
  }
}
