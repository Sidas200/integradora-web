package mx.utch.tdimp.api.model;

import java.time.OffsetDateTime;

/** Row of the v_player_summary view. */
public record AccountSummary(
    int saves,
    long playTimeSec,
    long enemiesDefeated,
    long itemsCrafted,
    int achievementsUnlocked,
    int achievementsTotal,
    OffsetDateTime lastSessionAt) {
}
