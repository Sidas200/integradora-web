package mx.utch.tdimp.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.List;
import mx.utch.tdimp.api.dto.AchievementDto;
import mx.utch.tdimp.api.model.Achievement;
import mx.utch.tdimp.api.repository.AchievementReader;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class AchievementServiceFindAllTest {

    @InjectMocks
    private AchievementServiceImpl achievementService;
    @Mock
    private AchievementReader achievementReader;

    @Test
    @DisplayName("Debe devolver una lista de logros")
    public void findAllTest() {
        List<Achievement> models = List.of(
            new Achievement("first_craft", "El poder se fabrica", "Fabrica tu primer objeto.", "achievement_forge", false, 1),
            new Achievement("chapter_1", "La promesa", "Termina el capítulo 1.", "achievement_chapter", false, 2)
        );

        when(achievementReader.findAllOrdered()).thenReturn(models);
        List<AchievementDto> dtos = achievementService.catalog();

        assertThat(dtos).hasSize(2);
    }
}
