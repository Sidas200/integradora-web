package mx.utch.tdimp.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import java.util.Map;

// updatedAt es de solo lectura: se ignora al recibirlo.
public record SettingsDto(
    @NotNull @Min(0) @Max(100) Integer musicVolume,
    @NotNull @Min(0) @Max(100) Integer sfxVolume,
    @NotNull @Pattern(regexp = "es|en") String language,
    @NotNull Boolean fullscreen,
    @NotNull @Size(max = 40) Map<String, @NotNull @Size(max = 40) String> controls,
    OffsetDateTime updatedAt) {
}
