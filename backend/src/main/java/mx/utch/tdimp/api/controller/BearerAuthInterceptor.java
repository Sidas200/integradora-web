package mx.utch.tdimp.api.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import mx.utch.tdimp.api.exception.UnauthenticatedException;
import mx.utch.tdimp.api.service.TokenIssuer;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

// Exige "Authorization: Bearer <access token>" y deja los claims en la petición.
// Solo se registra para /api/v1/account/** (WebConfig): las rutas públicas no pasan por aquí.
@Component
class BearerAuthInterceptor implements HandlerInterceptor {

  static final String CLAIMS_ATTRIBUTE = BearerAuthInterceptor.class.getName() + ".claims";
  private static final String PREFIX = "Bearer ";

  private final TokenIssuer tokens;

  BearerAuthInterceptor(TokenIssuer tokens) {
    this.tokens = tokens;
  }

  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
    String header = request.getHeader(HttpHeaders.AUTHORIZATION);
    if (header == null || !header.startsWith(PREFIX)) {
      // Sin token se responde TOKEN_EXPIRED: el cliente intenta /auth/refresh y, si falla, pide login.
      throw new UnauthenticatedException("TOKEN_EXPIRED", "A Bearer access token is required.");
    }
    request.setAttribute(CLAIMS_ATTRIBUTE, tokens.verify(header.substring(PREFIX.length()).trim()));
    return true;
  }
}
