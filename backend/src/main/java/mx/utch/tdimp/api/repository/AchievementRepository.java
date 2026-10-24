package mx.utch.tdimp.api.repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import mx.utch.tdimp.api.model.PlayerAchievement;

public interface AchievementRepository {

  // Todo el catálogo, con la fecha de desbloqueo del jugador (null = bloqueado).
  List<PlayerAchievement> forPlayer(UUID playerId);

  // true si se desbloqueó ahora; false si ya estaba.
  boolean unlock(UUID playerId, String achievementId, OffsetDateTime unlockedAt);
}
