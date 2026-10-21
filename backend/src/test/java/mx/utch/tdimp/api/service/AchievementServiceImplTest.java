package mx.utch.tdimp.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.List;
import mx.utch.tdimp.api.model.Achievement;
import mx.utch.tdimp.api.repository.AchievementReader;
import org.junit.jupiter.api.Test;

class AchievementServiceImplTest {

  private final AchievementReader reader = mock(AchievementReader.class);
  private final AchievementService service = new AchievementServiceImpl(reader);

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
}