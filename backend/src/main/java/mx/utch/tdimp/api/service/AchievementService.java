package mx.utch.tdimp.api.service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import mx.utch.tdimp.api.dto.AchievementDto;
import mx.utch.tdimp.api.dto.PlayerAchievementDto;

public interface AchievementService {

  List<AchievementDto> catalog();

  List<PlayerAchievementDto> forPlayer(UUID playerId);

  UnlockResult unlock(UUID playerId, String achievementId, OffsetDateTime unlockedAt);

  record UnlockResult(PlayerAchievementDto achievement, boolean created) {
  }
}
