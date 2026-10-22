package mx.utch.tdimp.api.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Optional;
import mx.utch.tdimp.api.dto.RefreshRequest;
import mx.utch.tdimp.api.dto.TokenResponse;
import mx.utch.tdimp.api.model.ClientType;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(1)
class BodyRefreshChannel implements RefreshChannel {

  @Override
  public boolean supports(ClientType client) {
    return client == ClientType.UNITY_PC || client == ClientType.MOBILE;
  }

  @Override
  public Optional<String> read(HttpServletRequest request, RefreshRequest body) {
    return Optional.ofNullable(body).map(RefreshRequest::refreshToken).filter(t -> !t.isBlank());
  }

  @Override
  public TokenResponse deliver(TokenResponse tokens, HttpServletResponse response) {
    return tokens;
  }

  @Override
  public void clear(HttpServletResponse response) {
    // El cliente nativo borra el token de su almacenamiento seguro.
  }
}
