package mx.utch.tdimp.api.config;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * A single UTC clock for the whole API. Services receive it by constructor,
 * so tests can pass a fixed clock (Clock.fixed) instead of the real time.
 */
@Configuration
class ClockConfig {

  @Bean
  Clock clock() {
    return Clock.systemUTC();
  }
}