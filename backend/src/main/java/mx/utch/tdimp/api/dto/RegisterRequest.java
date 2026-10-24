package mx.utch.tdimp.api.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import mx.utch.tdimp.api.model.ClientType;

public record RegisterRequest(
    @NotBlank @Email @Size(max = 254) String email,
    @NotNull @Pattern(regexp = "^[A-Za-z0-9_]{3,20}$", message = "Must be 3 to 20 letters, digits or underscores.")
    String username,
    @NotNull @Size(min = 8, max = 72) String password,
    @NotNull @AssertTrue Boolean acceptedPrivacyNotice,
    @NotNull ClientType client) {
}
