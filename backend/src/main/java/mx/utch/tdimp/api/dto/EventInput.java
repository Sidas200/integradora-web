package mx.utch.tdimp.api.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

public record EventInput(
    @NotNull UUID id,
    @NotNull @Pattern(regexp = "ENEMY_DEFEATED|ENEMY_DROP|PICKUP|CRAFT|DEATH|BOSS_DEFEATED|MILESTONE_COMPLETED")
    String type,
    @Size(max = 20) Map<String, Object> data,
    @NotNull OffsetDateTime occurredAt) {
}
