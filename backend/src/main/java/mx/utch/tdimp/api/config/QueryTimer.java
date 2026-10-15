package mx.utch.tdimp.api.config;

import java.util.function.Supplier;

public final class QueryTimer {

  private static final ThreadLocal<long[]> CURRENT = ThreadLocal.withInitial(() -> new long[2]);

  private QueryTimer() {
  }

  public static <T> Timed<T> time(Supplier<T> query) {
    long start = System.nanoTime();
    T result = query.get();
    long elapsed = System.nanoTime() - start;
    long[] acc = CURRENT.get();
    acc[0] += elapsed;
    acc[1]++;
    return new Timed<>(result, elapsed / 1_000_000.0);
  }

  static void reset() {
    long[] acc = CURRENT.get();
    acc[0] = 0;
    acc[1] = 0;
  }

  static double totalMillis() {
    return CURRENT.get()[0] / 1_000_000.0;
  }

  static long count() {
    return CURRENT.get()[1];
  }

  static void clear() {
    CURRENT.remove();
  }

  public record Timed<T>(T value, double millis) {
  }
}
