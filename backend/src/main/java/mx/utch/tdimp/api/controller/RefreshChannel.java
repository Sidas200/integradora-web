package mx.utch.tdimp.api.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Optional;
import mx.utch.tdimp.api.dto.RefreshRequest;
import mx.utch.tdimp.api.dto.TokenResponse;
import mx.utch.tdimp.api.model.ClientType;

// Cómo viaja el refresh token: cookie HttpOnly para el navegador, JSON para Unity y Flutter.
interface RefreshChannel {

  boolean supports(ClientType client);

  // Lee el refresh token de la petición si llegó por este canal.
  Optional<String> read(HttpServletRequest request, RefreshRequest body);

  // Entrega el refresh token y devuelve el cuerpo que verá el cliente.
  TokenResponse deliver(TokenResponse tokens, HttpServletResponse response);

  void clear(HttpServletResponse response);
}
