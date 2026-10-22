package mx.utch.tdimp.api.dto;

import java.time.OffsetDateTime;

public record PlayerAchievementDto(
    String id,
    String name,
    String description,
    String iconKey,
    boolean hidden,
    int sortOrder,
    boolean unlocked,
    OffsetDateTime unlockedAt) {
}
