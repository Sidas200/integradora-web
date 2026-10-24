package mx.utch.tdimp.api.service;

import mx.utch.tdimp.api.dto.LoginRequest;
import mx.utch.tdimp.api.dto.RegisterRequest;
import mx.utch.tdimp.api.dto.TokenResponse;

public interface AuthService {

  AuthResult register(RegisterRequest request, String userAgent);

  AuthResult login(LoginRequest request, String userAgent);

  AuthResult refresh(String refreshToken, String userAgent);

  void logout(String refreshToken);

  // Confirma la contraseña y devuelve un access token con auth_time = ahora (sin refresh token nuevo).
  TokenResponse reauthenticate(AccessClaims claims, String password);
}