package mx.utch.tdimp.api.controller;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Address of the client that made the request. Behind Vercel and Render the real address arrives in
 * X-Forwarded-For; server.forward-headers-strategy=framework makes getRemoteAddr() return it.
 */
final class ClientIp {

  private ClientIp() {
  }

  static String of(HttpServletRequest request) {
    String address = request.getRemoteAddr();
    return address == null || address.isBlank() ? "unknown" : address;
  }
}