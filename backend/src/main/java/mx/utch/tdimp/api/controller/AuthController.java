package mx.utch.tdimp.api.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;
import mx.utch.tdimp.api.dto.LoginRequest;
import mx.utch.tdimp.api.dto.RefreshRequest;
import mx.utch.tdimp.api.dto.RegisterRequest;
import mx.utch.tdimp.api.dto.TokenResponse;
import mx.utch.tdimp.api.exception.ErrorCode;
import mx.utch.tdimp.api.exception.UnauthenticatedException;
import mx.utch.tdimp.api.service.AuthResult;
import mx.utch.tdimp.api.service.AuthService;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
class AuthController {

  private final AuthService auth;
  private final List<RefreshChannel> channels;

  AuthController(AuthService auth, List<RefreshChannel> channels) {
    this.auth = auth;
    this.channels = channels;
  }

  @PostMapping("/register")
  ResponseEntity<TokenResponse> register(@Valid @RequestBody RegisterRequest request,
                                         @RequestHeader(value = HttpHeaders.USER_AGENT, required = false) String userAgent,
                                         HttpServletResponse response) {
    return respond(HttpStatus.CREATED, auth.register(request, userAgent), response);
  }

  @PostMapping("/login")
  ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request,
                                      @RequestHeader(value = HttpHeaders.USER_AGENT, required = false) String userAgent,
                                      HttpServletResponse response) {
    return respond(HttpStatus.OK, auth.login(request, userAgent), response);
  }

  @PostMapping("/refresh")
  ResponseEntity<TokenResponse> refresh(@Valid @RequestBody(required = false) RefreshRequest body,
                                        @RequestHeader(value = HttpHeaders.USER_AGENT, required = false) String userAgent,
                                        HttpServletRequest request, HttpServletResponse response) {
    String token = readToken(request, body)
        .orElseThrow(() -> new UnauthenticatedException(ErrorCode.INVALID_SESSION, "A refresh token is required."));
    try {
      return respond(HttpStatus.OK, auth.refresh(token, userAgent), response);
    } catch (UnauthenticatedException ex) {
      channels.forEach(c -> c.clear(response));
      throw ex;
    }
  }

  @PostMapping("/logout")
  ResponseEntity<Void> logout(@Valid @RequestBody(required = false) RefreshRequest body,
                              HttpServletRequest request, HttpServletResponse response) {
    readToken(request, body).ifPresent(auth::logout);
    channels.forEach(c -> c.clear(response));
    return ResponseEntity.noContent().build();
  }

  private Optional<String> readToken(HttpServletRequest request, RefreshRequest body) {
    return channels.stream().map(c -> c.read(request, body)).flatMap(Optional::stream).findFirst();
  }

  private ResponseEntity<TokenResponse> respond(HttpStatus status, AuthResult result, HttpServletResponse response) {
    RefreshChannel channel = channels.stream().filter(c -> c.supports(result.client())).findFirst().orElseThrow();
    return ResponseEntity.status(status).cacheControl(CacheControl.noStore())
        .body(channel.deliver(result.tokens(), response));
  }
}
