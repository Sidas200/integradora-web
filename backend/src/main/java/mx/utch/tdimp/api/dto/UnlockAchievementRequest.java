package mx.utch.tdimp.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;

public record UnlockAchievementRequest(@NotNull OffsetDateTime unlockedAt, @Min(1) @Max(3) Integer slot) {
}
