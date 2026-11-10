package mx.utch.tdimp.api.exception;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/** The Retry-After header is whole seconds: rounded up so the client never retries too early. */
class TooManyAttemptsExceptionTest {

  @ParameterizedTest(name = "{0} ms -> {1} s")
  @CsvSource({
      "900000, 900",  // exactly 15 minutes
      "1500, 2",      // 1.5 s rounds up
      "1, 1",         // a millisecond is still one second
      "0, 1",         // never 0: the client must wait at least one second
      "60001, 61"
  })
  void retryAfterIsRoundedUpToWholeSeconds(long millis, long expectedSeconds) {
    var ex = new TooManyAttemptsException(Duration.ofMillis(millis));

    assertThat(ex.retryAfterSeconds()).isEqualTo(expectedSeconds);
    assertThat(ex.retryAfter()).isEqualTo(Duration.ofMillis(millis));
  }
}