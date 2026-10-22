package mx.utch.tdimp.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record SaveStatsDto(
    @NotNull @Min(0) Integer playTimeSec,
    @NotNull @Min(0) Integer enemiesDefeated,
    @NotNull @Min(0) Integer deaths,
    @NotNull @Min(0) Integer materialsCollected,
    @NotNull @Min(0) Integer itemsCrafted) {
}
