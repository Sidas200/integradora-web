package mx.utch.tdimp.api.controller;

import static org.hamcrest.Matchers.nullValue;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import mx.utch.tdimp.api.dto.AchievementDto;
import mx.utch.tdimp.api.service.AchievementService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AchievementController.class)
class AchievementControllerTest {

  @Autowired
  MockMvc mvc;

  @MockitoBean
  AchievementService achievements;

  @Test
  void catalogIsAPlainListCachedOneHour() throws Exception {
    when(achievements.catalog()).thenReturn(List.of(
        new AchievementDto("first_material", "Primeros pasos", "Recolecta tu primer material.", "achievement_material", false, 10),
        new AchievementDto("rulebreaker", "Logro oculto", null, null, true, 50)));

    mvc.perform(get("/api/v1/achievements"))
        .andExpect(status().isOk())
        .andExpect(header().string("Cache-Control", "max-age=3600, public"))
        .andExpect(jsonPath("$.length()").value(2))
        .andExpect(jsonPath("$[0].id").value("first_material"))
        .andExpect(jsonPath("$[1].name").value("Logro oculto"))
        .andExpect(jsonPath("$[1].description").value(nullValue()));
  }
}