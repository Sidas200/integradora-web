package mx.utch.tdimp.api.service;

import mx.utch.tdimp.api.dto.LoginRequest;
import mx.utch.tdimp.api.dto.RegisterRequest;

public interface AuthService {

  AuthResult register(RegisterRequest request, String userAgent);

  AuthResult login(LoginRequest request, String userAgent);

  AuthResult refresh(String refreshToken, String userAgent);

  void logout(String refreshToken);
}
