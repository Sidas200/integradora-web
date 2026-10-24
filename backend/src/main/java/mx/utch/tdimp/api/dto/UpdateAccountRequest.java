package mx.utch.tdimp.api.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record UpdateAccountRequest(
    @NotNull @Pattern(regexp = "^[A-Za-z0-9_]{3,20}$", message = "Must be 3 to 20 letters, digits or underscores.")
    String username) {
}