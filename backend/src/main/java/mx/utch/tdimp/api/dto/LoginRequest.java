package mx.utch.tdimp.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import mx.utch.tdimp.api.model.ClientType;

public record LoginRequest(
    @NotBlank @Email @Size(max = 254) String email,
    @NotNull @Size(min = 1, max = 72) String password,
    @NotNull ClientType client) {
}
