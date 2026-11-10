package mx.utch.tdimp.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.catchThrowable;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import mx.utch.tdimp.api.config.RateLimitProperties;
import mx.utch.tdimp.api.config.RateLimitProperties.Limit;
import mx.utch.tdimp.api.exception.TooManyAttemptsException;
import mx.utch.tdimp.api.model.RateLimitRule;
import org.junit.jupiter.api.Test;

/** Unit tests of the in-memory attempt limit. A clock that the test moves forward replaces the real time. */
class InMemoryRateLimiterTest {

  private static final Instant START = Instant.parse("2026-11-09T18:00:00Z");
  private static final RateLimitProperties LIMITS = new RateLimitProperties(true,
      new Limit(3, Duration.ofMinutes(15)),  // login
      new Limit(2, Duration.ofHours(1)),     // register
      new Limit(5, Duration.ofMinutes(15)),  // reauthenticate
      new Limit(10, Duration.ofHours(1)));   // subscriptions

  /** Clock whose time only changes when the test says so. */
  private static final class TestClock extends Clock {
    private Instant now = START;

    void advance(Duration duration) {
      now = now.plus(duration);
    }

    @Override
    public Instant instant() {
      return now;
    }

    @Override
    public ZoneId getZone() {
      return ZoneOffset.UTC;
    }

    @Override
    public Clock withZone(ZoneId zone) {
      return this;
    }
  }

  private final TestClock clock = new TestClock();
  private final InMemoryRateLimiter limiter = new InMemoryRateLimiter(LIMITS, clock);

  private TooManyAttemptsException blocked(RateLimitRule rule, String key) {
    Throwable thrown = catchThrowable(() -> limiter.acquire(rule, key));
    assertThat(thrown).isInstanceOf(TooManyAttemptsException.class);
    return (TooManyAttemptsException) thrown;
  }

  @Test
  void allowsTheConfiguredAttemptsAndBlocksTheNextOne() {
    for (int i = 0; i < 3; i++) {
      limiter.acquire(RateLimitRule.LOGIN, "1.2.3.4|felc@example.com");
    }

    TooManyAttemptsException ex = blocked(RateLimitRule.LOGIN, "1.2.3.4|felc@example.com");

    assertThat(ex.retryAfter()).isEqualTo(Duration.ofMinutes(15));
    assertThat(ex.retryAfterSeconds()).isEqualTo(900);
  }

  @Test
  void retryAfterCountsDownAndTheWindowOpensAgainWhenItEnds() {
    for (int i = 0; i < 3; i++) {
      limiter.acquire(RateLimitRule.LOGIN, "key");
    }

    clock.advance(Duration.ofMinutes(10));
    assertThat(blocked(RateLimitRule.LOGIN, "key").retryAfter()).isEqualTo(Duration.ofMinutes(5));

    clock.advance(Duration.ofMinutes(5)); // exactly at the end of the window
    assertThatCode(() -> limiter.acquire(RateLimitRule.LOGIN, "key")).doesNotThrowAnyException();
  }

  @Test
  void attemptsWhileBlockedDoNotExtendTheWindow() {
    for (int i = 0; i < 3; i++) {
      limiter.acquire(RateLimitRule.LOGIN, "key");
    }
    for (int i = 0; i < 20; i++) {
      blocked(RateLimitRule.LOGIN, "key");
    }

    clock.advance(Duration.ofMinutes(15));
    assertThatCode(() -> limiter.acquire(RateLimitRule.LOGIN, "key")).doesNotThrowAnyException();
  }

  @Test
  void eachKeyAndEachRuleHasItsOwnCounter() {
    limiter.acquire(RateLimitRule.REGISTER, "1.1.1.1");
    limiter.acquire(RateLimitRule.REGISTER, "1.1.1.1");
    blocked(RateLimitRule.REGISTER, "1.1.1.1");

    // Another address, and the same address under another rule, are still free.
    assertThatCode(() -> limiter.acquire(RateLimitRule.REGISTER, "2.2.2.2")).doesNotThrowAnyException();
    assertThatCode(() -> limiter.acquire(RateLimitRule.SUBSCRIPTIONS, "1.1.1.1")).doesNotThrowAnyException();
    assertThatCode(() -> limiter.acquire(RateLimitRule.LOGIN, "1.1.1.1")).doesNotThrowAnyException();
  }

  @Test
  void eachRuleUsesItsOwnLimit() {
    for (int i = 0; i < 5; i++) {
      limiter.acquire(RateLimitRule.REAUTHENTICATE, "player");
    }
    blocked(RateLimitRule.REAUTHENTICATE, "player");

    for (int i = 0; i < 10; i++) {
      limiter.acquire(RateLimitRule.SUBSCRIPTIONS, "ip");
    }
    assertThat(blocked(RateLimitRule.SUBSCRIPTIONS, "ip").retryAfter()).isEqualTo(Duration.ofHours(1));
  }

  @Test
  void resetForgetsTheAttemptsOfThatKeyOnly() {
    for (int i = 0; i < 3; i++) {
      limiter.acquire(RateLimitRule.LOGIN, "mine");
      limiter.acquire(RateLimitRule.LOGIN, "other");
    }

    limiter.reset(RateLimitRule.LOGIN, "mine");

    assertThatCode(() -> limiter.acquire(RateLimitRule.LOGIN, "mine")).doesNotThrowAnyException();
    blocked(RateLimitRule.LOGIN, "other");
  }

  @Test
  void resettingAKeyThatWasNeverUsedIsHarmless() {
    assertThatCode(() -> limiter.reset(RateLimitRule.LOGIN, "never-seen")).doesNotThrowAnyException();
  }

  @Test
  void expiredWindowsAreRemovedWhenThereAreTooManyKeys() {
    for (int i = 0; i <= InMemoryRateLimiter.PURGE_THRESHOLD; i++) {
      limiter.acquire(RateLimitRule.SUBSCRIPTIONS, "ip-" + i);
    }
    assertThat(limiter.trackedKeys()).isGreaterThan(InMemoryRateLimiter.PURGE_THRESHOLD);

    clock.advance(Duration.ofHours(2));
    limiter.acquire(RateLimitRule.SUBSCRIPTIONS, "new-ip");

    assertThat(limiter.trackedKeys()).isEqualTo(1);
  }

  @Test
  void simultaneousAttemptsAreAllCounted() throws Exception {
    InMemoryRateLimiter shared = new InMemoryRateLimiter(LIMITS, clock);
    AtomicInteger allowed = new AtomicInteger();
    CountDownLatch start = new CountDownLatch(1);
    ExecutorService pool = Executors.newFixedThreadPool(8);
    List<Future<?>> tasks = new ArrayList<>();
    try {
      for (int i = 0; i < 50; i++) {
        tasks.add(pool.submit(() -> {
          start.await();
          try {
            shared.acquire(RateLimitRule.SUBSCRIPTIONS, "same-ip");
            allowed.incrementAndGet();
          } catch (TooManyAttemptsException expected) {
            // over the limit
          }
          return null;
        }));
      }
      start.countDown();
      for (Future<?> task : tasks) {
        task.get(5, TimeUnit.SECONDS);
      }
    } finally {
      pool.shutdownNow();
    }

    assertThat(allowed.get()).isEqualTo(10);
  }
}