package mx.utch.tdimp.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.time.OffsetDateTime;
import java.util.UUID;

// El id lo genera el juego: reenviar la misma sesión no la duplica.
public record PlaySessionInput(
    @NotNull UUID id,
    @NotNull OffsetDateTime startedAt,
    @NotNull OffsetDateTime endedAt,
    @NotNull @Min(0) Integer durationSec,
    @NotNull @Pattern(regexp = "WINDOWS|MACOS|LINUX") String platform,
    @Pattern(regexp = "^[0-9A-Za-z.+-]{1,30}$") String gameVersion) {
}
