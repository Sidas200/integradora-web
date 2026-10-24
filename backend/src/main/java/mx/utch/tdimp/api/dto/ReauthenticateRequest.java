package mx.utch.tdimp.api.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// Confirma la contraseña antes de una acción sensible (eliminar la cuenta).
public record ReauthenticateRequest(@NotNull @Size(min = 1, max = 72) String password) {
}