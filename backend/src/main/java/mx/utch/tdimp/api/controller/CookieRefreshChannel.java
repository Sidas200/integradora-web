package mx.utch.tdimp.api.controller;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import java.util.Arrays;
import java.util.Optional;
import mx.utch.tdimp.api.config.TdimpProperties;
import mx.utch.tdimp.api.dto.RefreshRequest;
import mx.utch.tdimp.api.dto.TokenResponse;
import mx.utch.tdimp.api.model.ClientType;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

@Component
@Order(2)
class CookieRefreshChannel implements RefreshChannel {

  static final String COOKIE = "tdimp_rt";
  private static final String CSRF_HEADER = "X-Requested-With";
  private static final String CSRF_VALUE = "tdimp-pwa";
  private static final String PATH = "/api/v1/auth";

  private final Duration maxAge;

  CookieRefreshChannel(TdimpProperties properties) {
    this.maxAge = properties.security().refreshTokenTtl();
  }

  @Override
  public boolean supports(ClientType client) {
    return client == ClientType.WEB;
  }

  @Override
  public Optional<String> read(HttpServletRequest request, RefreshRequest body) {
    // Defensa CSRF: un formulario de otro sitio no puede mandar este header.
    if (!CSRF_VALUE.equals(request.getHeader(CSRF_HEADER)) || request.getCookies() == null) {
      return Optional.empty();
    }
    return Arrays.stream(request.getCookies())
        .filter(c -> COOKIE.equals(c.getName()))
        .map(Cookie::getValue)
        .filter(v -> !v.isBlank())
        .findFirst();
  }

  @Override
  public TokenResponse deliver(TokenResponse tokens, HttpServletResponse response) {
    response.addHeader(HttpHeaders.SET_COOKIE, cookie(tokens.refreshToken(), maxAge).toString());
    return tokens.withoutRefreshToken();
  }

  @Override
  public void clear(HttpServletResponse response) {
    response.addHeader(HttpHeaders.SET_COOKIE, cookie("", Duration.ZERO).toString());
  }

  private static ResponseCookie cookie(String value, Duration maxAge) {
    return ResponseCookie.from(COOKIE, value)
        .httpOnly(true)
        .secure(true)
        .sameSite("Strict")
        .path(PATH)
        .maxAge(maxAge)
        .build();
  }
}
