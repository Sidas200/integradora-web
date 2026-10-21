package mx.utch.tdimp.api.dto;

import java.time.OffsetDateTime;

public record AccountSummaryDto(
    int saves,
    long playTimeSec,
    long enemiesDefeated,
    long itemsCrafted,
    int achievementsUnlocked,
    int achievementsTotal,
    OffsetDateTime lastSessionAt) {
}
