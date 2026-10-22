package mx.utch.tdimp.api.service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import mx.utch.tdimp.api.dto.AchievementDto;
import mx.utch.tdimp.api.dto.PlayerAchievementDto;

public interface AchievementService {

  /** Public catalog: hidden achievements always come masked. */
  List<AchievementDto> catalog();

  /** Whole catalog with the player's unlocks; hidden ones stay masked until unlocked. */
  List<PlayerAchievementDto> forPlayer(UUID playerId);

  /** Idempotent: unlocking again keeps the first date and returns created = false. */
  UnlockResult unlock(UUID playerId, String achievementId, OffsetDateTime unlockedAt);

  record UnlockResult(PlayerAchievementDto achievement, boolean created) {
  }
}
