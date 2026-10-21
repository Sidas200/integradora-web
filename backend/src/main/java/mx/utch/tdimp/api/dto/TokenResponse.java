package mx.utch.tdimp.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

// refreshToken solo viaja en el JSON para UNITY_PC y MOBILE; en WEB va en la cookie HttpOnly.
@JsonInclude(JsonInclude.Include.NON_NULL)
public record TokenResponse(
    String accessToken,
    String tokenType,
    long expiresInSec,
    String refreshToken,
    SessionPlayerDto player) {

  public TokenResponse withoutRefreshToken() {
    return new TokenResponse(accessToken, tokenType, expiresInSec, null, player);
  }
}
