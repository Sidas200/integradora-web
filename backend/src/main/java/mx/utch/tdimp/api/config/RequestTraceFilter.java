package mx.utch.tdimp.api.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Locale;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingResponseWrapper;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class RequestTraceFilter extends OncePerRequestFilter {

  private static final Logger log = LoggerFactory.getLogger("mx.utch.tdimp.api.trace");
  private static final double MB = 1024.0 * 1024.0;

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    return !request.getRequestURI().startsWith("/api/");
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    String requestId = UUID.randomUUID().toString().substring(0, 8);
    MDC.put("requestId", requestId);
    QueryTimer.reset();

    Runtime runtime = Runtime.getRuntime();
    long heapBefore = runtime.totalMemory() - runtime.freeMemory();
    long start = System.nanoTime();
    String target = request.getRequestURI() + (request.getQueryString() == null ? "" : "?" + request.getQueryString());
    long requestBytes = Math.max(request.getContentLengthLong(), 0);

    log.info("--> {} {} | payload={} B | content-type={}", request.getMethod(), target, requestBytes,
        request.getContentType());

    ContentCachingResponseWrapper wrapped = new ContentCachingResponseWrapper(response);
    try {
      chain.doFilter(request, wrapped);
    } finally {
      double totalMs = (System.nanoTime() - start) / 1_000_000.0;
      double dbMs = QueryTimer.totalMillis();
      long heapAfter = runtime.totalMemory() - runtime.freeMemory();
      int responseBytes = wrapped.getContentSize();

      wrapped.setHeader("X-Request-Id", requestId);
      wrapped.setHeader("Server-Timing",
          String.format(Locale.ROOT, "app;desc=\"Spring Boot\";dur=%.1f, db;desc=\"PostgreSQL\";dur=%.1f", totalMs, dbMs));

      log.info("<-- {} {} -> {} en {} ms (BD: {} consultas, {} ms) | respuesta={} B | heap {} -> {} MB (max {} MB) | hilo={}",
          request.getMethod(), target, wrapped.getStatus(),
          fmt(totalMs), QueryTimer.count(), fmt(dbMs), responseBytes,
          fmt(heapBefore / MB), fmt(heapAfter / MB), fmt(runtime.maxMemory() / MB),
          Thread.currentThread().getName());

      wrapped.copyBodyToResponse();
      QueryTimer.clear();
      MDC.remove("requestId");
    }
  }

  private static String fmt(double value) {
    return String.format(Locale.ROOT, "%.1f", value);
  }
}
