package mx.utch.tdimp.api.service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import mx.utch.tdimp.api.dto.AchievementDto;
import mx.utch.tdimp.api.dto.PlayerAchievementDto;
import mx.utch.tdimp.api.exception.NotFoundException;
import mx.utch.tdimp.api.repository.AchievementRepository;
import mx.utch.tdimp.api.repository.CatalogReader;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class AchievementServiceImpl implements AchievementService {

  private static final String MASKED_NAME = "???";

  private final CatalogReader catalog;
  private final AchievementRepository achievements;

  AchievementServiceImpl(CatalogReader catalog, AchievementRepository achievements) {
    this.catalog = catalog;
    this.achievements = achievements;
  }

  @Override
  @Transactional(readOnly = true)
  public List<AchievementDto> catalog() {
    return catalog.achievements().stream()
        .map(a -> a.hidden() ? new AchievementDto(a.id(), MASKED_NAME, null, null, true, a.sortOrder()) : a)
        .toList();
  }

  @Override
  @Transactional(readOnly = true)
  public List<PlayerAchievementDto> forPlayer(UUID playerId) {
    return achievements.forPlayer(playerId).stream().map(AchievementServiceImpl::mask).toList();
  }

  @Override
  @Transactional
  public UnlockResult unlock(UUID playerId, String achievementId, OffsetDateTime unlockedAt) {
    if (!catalog.achievementExists(achievementId)) {
      throw new NotFoundException("Achievement " + achievementId + " does not exist.");
    }
    boolean created = achievements.unlock(playerId, achievementId, unlockedAt);
    var dto = achievements.forPlayer(playerId).stream()
        .filter(a -> a.id().equals(achievementId))
        .findFirst()
        .orElseThrow();
    return new UnlockResult(dto, created);
  }

  // Un logro oculto no revela nombre ni descripción hasta desbloquearse.
  private static PlayerAchievementDto mask(PlayerAchievementDto a) {
    if (!a.hidden() || a.unlocked()) {
      return a;
    }
    return new PlayerAchievementDto(a.id(), MASKED_NAME, null, null, true, a.sortOrder(), false, null);
  }
}
