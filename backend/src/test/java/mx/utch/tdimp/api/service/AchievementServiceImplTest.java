package mx.utch.tdimp.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import mx.utch.tdimp.api.exception.NotFoundException;
import mx.utch.tdimp.api.model.Achievement;
import mx.utch.tdimp.api.model.PlayerAchievement;
import mx.utch.tdimp.api.repository.AchievementReader;
import mx.utch.tdimp.api.repository.AchievementRepository;
import mx.utch.tdimp.api.repository.CatalogReader;
import org.junit.jupiter.api.Test;

class AchievementServiceImplTest {

  private final AchievementReader reader = mock(AchievementReader.class);
  private final AchievementRepository achievements = mock(AchievementRepository.class);
  private final CatalogReader catalog = mock(CatalogReader.class);
  private final AchievementService service = new AchievementServiceImpl(reader, achievements, catalog);

  private static final Achievement HIDDEN =
      new Achievement("rulebreaker", "Rulebreaker", "Descubre el significado de la marca.", "achievement_mark", true, 50);

  @Test
  void visibleAchievementsKeepTheirTexts() {
    when(reader.findAllOrdered()).thenReturn(List.of(
        new Achievement("first_craft", "El poder se fabrica", "Fabrica tu primer objeto.", "achievement_forge", false, 20)));

    var dto = service.catalog().getFirst();

    assertThat(dto.name()).isEqualTo("El poder se fabrica");
    assertThat(dto.description()).isEqualTo("Fabrica tu primer objeto.");
    assertThat(dto.iconKey()).isEqualTo("achievement_forge");
  }

  @Test
  void hiddenAchievementsAreMaskedInThePublicCatalog() {
    when(reader.findAllOrdered()).thenReturn(List.of(
        new Achievement("rulebreaker", "Rulebreaker", "Descubre el significado de la marca.", "achievement_mark", true, 50)));

    var dto = service.catalog().getFirst();

    assertThat(dto.id()).isEqualTo("rulebreaker");
    assertThat(dto.name()).isEqualTo(Achievement.MASKED_NAME);
    assertThat(dto.description()).isNull();
    assertThat(dto.iconKey()).isNull();
    assertThat(dto.hidden()).isTrue();
    assertThat(dto.sortOrder()).isEqualTo(50);
  }

  @Test
  void hiddenAchievementsStayMaskedForThePlayerUntilUnlocked() {
    UUID player = UUID.randomUUID();
    OffsetDateTime unlockedAt = OffsetDateTime.parse("2026-10-21T10:00:00Z");
    when(achievements.forPlayer(player)).thenReturn(List.of(new PlayerAchievement(HIDDEN, null)));
    assertThat(service.forPlayer(player).getFirst().name()).isEqualTo(Achievement.MASKED_NAME);

    when(achievements.forPlayer(player)).thenReturn(List.of(new PlayerAchievement(HIDDEN, unlockedAt)));
    var unlocked = service.forPlayer(player).getFirst();
    assertThat(unlocked.name()).isEqualTo("Rulebreaker");
    assertThat(unlocked.unlocked()).isTrue();
    assertThat(unlocked.unlockedAt()).isEqualTo(unlockedAt);
  }

  @Test
  void unlockingAnAchievementOutsideTheCatalogIsNotFound() {
    when(catalog.achievementExists("nope")).thenReturn(false);

    assertThatThrownBy(() -> service.unlock(UUID.randomUUID(), "nope", OffsetDateTime.now()))
        .isInstanceOf(NotFoundException.class);
  }
}
