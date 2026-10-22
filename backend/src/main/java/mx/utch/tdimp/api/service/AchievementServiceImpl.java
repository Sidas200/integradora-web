package mx.utch.tdimp.api.service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import mx.utch.tdimp.api.dto.AchievementDto;
import mx.utch.tdimp.api.dto.PlayerAchievementDto;
import mx.utch.tdimp.api.exception.NotFoundException;
import mx.utch.tdimp.api.model.Achievement;
import mx.utch.tdimp.api.model.PlayerAchievement;
import mx.utch.tdimp.api.repository.AchievementReader;
import mx.utch.tdimp.api.repository.AchievementRepository;
import mx.utch.tdimp.api.repository.CatalogReader;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class AchievementServiceImpl implements AchievementService {

  private final AchievementReader reader;
  private final AchievementRepository achievements;
  private final CatalogReader catalog;

  AchievementServiceImpl(AchievementReader reader, AchievementRepository achievements, CatalogReader catalog) {
    this.reader = reader;
    this.achievements = achievements;
    this.catalog = catalog;
  }

  @Override
  @Transactional(readOnly = true)
  public List<AchievementDto> catalog() {
    return reader.findAllOrdered().stream()
        .map(a -> a.maskedUnless(false))
        .map(AchievementServiceImpl::toDto)
        .toList();
  }

  @Override
  @Transactional(readOnly = true)
  public List<PlayerAchievementDto> forPlayer(UUID playerId) {
    return achievements.forPlayer(playerId).stream().map(AchievementServiceImpl::toDto).toList();
  }

  @Override
  @Transactional
  public UnlockResult unlock(UUID playerId, String achievementId, OffsetDateTime unlockedAt) {
    if (!catalog.achievementExists(achievementId)) {
      throw new NotFoundException("Achievement " + achievementId + " does not exist.");
    }
    boolean created = achievements.unlock(playerId, achievementId, unlockedAt);
    var unlocked = achievements.forPlayer(playerId).stream()
        .filter(a -> a.achievement().id().equals(achievementId))
        .findFirst()
        .orElseThrow();
    return new UnlockResult(toDto(unlocked), created);
  }

  private static AchievementDto toDto(Achievement a) {
    return new AchievementDto(a.id(), a.name(), a.description(), a.iconKey(), a.hidden(), a.sortOrder());
  }

  private static PlayerAchievementDto toDto(PlayerAchievement pa) {
    Achievement a = pa.achievement().maskedUnless(pa.unlocked());
    return new PlayerAchievementDto(a.id(), a.name(), a.description(), a.iconKey(), a.hidden(), a.sortOrder(),
        pa.unlocked(), pa.unlockedAt());
  }
}
