package mx.utch.tdimp.api.service;

import mx.utch.tdimp.api.dto.TokenResponse;
import mx.utch.tdimp.api.model.ClientType;

// tokens trae el refreshToken siempre; el canal (cookie o JSON) decide cómo entregarlo según el cliente.
public record AuthResult(TokenResponse tokens, ClientType client) {
}
