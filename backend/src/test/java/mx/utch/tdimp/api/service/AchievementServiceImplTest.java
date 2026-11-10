package mx.utch.tdimp.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
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

  @Test
  void theCatalogKeepsTheOrderOfTheReaderAndCanBeEmpty() {
    when(reader.findAllOrdered()).thenReturn(List.of(
        new Achievement("first_material", "Primeros pasos", "Recolecta tu primer material.", "achievement_material", false, 10),
        HIDDEN,
        new Achievement("first_craft", "El poder se fabrica", "Fabrica tu primer objeto.", "achievement_forge", false, 20)));

    assertThat(service.catalog()).extracting(a -> a.id()).containsExactly("first_material", "rulebreaker", "first_craft");

    when(reader.findAllOrdered()).thenReturn(List.of());
    assertThat(service.catalog()).isEmpty();
  }

  @Test
  void aVisibleAchievementShowsItsTextsToThePlayerEvenWhileLocked() {
    UUID player = UUID.randomUUID();
    var visible = new Achievement("first_craft", "El poder se fabrica", "Fabrica tu primer objeto.", "achievement_forge", false, 20);
    when(achievements.forPlayer(player)).thenReturn(List.of(new PlayerAchievement(visible, null)));

    var dto = service.forPlayer(player).getFirst();

    assertThat(dto.name()).isEqualTo("El poder se fabrica");
    assertThat(dto.description()).isEqualTo("Fabrica tu primer objeto.");
    assertThat(dto.unlocked()).isFalse();
    assertThat(dto.unlockedAt()).isNull();
  }

  @Test
  void unlockingSavesTheDateSentByTheGameAndSaysItIsNew() {
    UUID player = UUID.randomUUID();
    OffsetDateTime unlockedAt = OffsetDateTime.parse("2026-11-09T18:00:00Z");
    when(catalog.achievementExists("rulebreaker")).thenReturn(true);
    when(achievements.unlock(player, "rulebreaker", unlockedAt)).thenReturn(true);
    when(achievements.forPlayer(player)).thenReturn(List.of(new PlayerAchievement(HIDDEN, unlockedAt)));

    var result = service.unlock(player, "rulebreaker", unlockedAt);

    assertThat(result.created()).isTrue();
    assertThat(result.achievement().id()).isEqualTo("rulebreaker");
    assertThat(result.achievement().unlocked()).isTrue();
    assertThat(result.achievement().unlockedAt()).isEqualTo(unlockedAt);
    // Once unlocked, the hidden achievement reveals its real name.
    assertThat(result.achievement().name()).isEqualTo("Rulebreaker");
    verify(achievements).unlock(player, "rulebreaker", unlockedAt);
  }

  @Test
  void unlockingAgainKeepsTheFirstDateAndIsNotNew() {
    UUID player = UUID.randomUUID();
    OffsetDateTime first = OffsetDateTime.parse("2026-11-01T10:00:00Z");
    OffsetDateTime again = OffsetDateTime.parse("2026-11-09T18:00:00Z");
    when(catalog.achievementExists("rulebreaker")).thenReturn(true);
    when(achievements.unlock(player, "rulebreaker", again)).thenReturn(false);
    when(achievements.forPlayer(player)).thenReturn(List.of(new PlayerAchievement(HIDDEN, first)));

    var result = service.unlock(player, "rulebreaker", again);

    assertThat(result.created()).isFalse();
    assertThat(result.achievement().unlockedAt()).isEqualTo(first);
  }
}