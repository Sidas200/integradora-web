package mx.utch.tdimp.api.repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import mx.utch.tdimp.api.dto.PlayerAchievementDto;

public interface AchievementRepository {

  List<PlayerAchievementDto> forPlayer(UUID playerId);

  // true si se desbloqueó ahora; false si ya estaba.
  boolean unlock(UUID playerId, String achievementId, OffsetDateTime unlockedAt);
}
