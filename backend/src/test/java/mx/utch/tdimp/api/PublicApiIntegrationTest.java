package mx.utch.tdimp.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * The whole public API against real PostgreSQL: controller → service → repository → database.
 * {@code @Transactional} rolls back what each test writes, so tdimp_test stays clean.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PublicApiIntegrationTest {

  @Autowired
  MockMvc mvc;

  @Autowired
  JdbcClient jdbc;

  @Test
  void achievementCatalogComesFromTheDatabaseWithHiddenOnesMasked() throws Exception {
    mvc.perform(get("/api/v1/achievements"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value("first_material"))
        .andExpect(jsonPath("$[?(@.id == 'rulebreaker')].name").value("Logro oculto"))
        .andExpect(jsonPath("$[?(@.id == 'first_craft')].name").value("El poder se fabrica"));
  }

  @Test
  void newsListAndDetailReadPublishedPosts() throws Exception {
    mvc.perform(get("/api/v1/news").param("size", "1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content.length()").value(1))
        .andExpect(jsonPath("$.page.size").value(1));

    mvc.perform(get("/api/v1/news/devlog-01-forge-and-materials"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.title").value("Devlog #1: la forja y los materiales"))
        .andExpect(jsonPath("$.contentMd").isNotEmpty());

    mvc.perform(get("/api/v1/news/does-not-exist"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("NOT_FOUND"));
  }

  @Test
  void subscriptionIsAcceptedTwiceButStoredOnce() throws Exception {
    String body = """
        { "email": "Tester@Example.com", "language": "es", "consent": true }
        """;

    for (int i = 0; i < 2; i++) {
      mvc.perform(post("/api/v1/subscriptions").contentType(MediaType.APPLICATION_JSON).content(body))
          .andExpect(status().isAccepted());
    }

    long stored = jdbc.sql("select count(*) from launch_subscriptions where email = 'tester@example.com'")
        .query(Long.class).single();
    assertThat(stored).isEqualTo(1);
  }

  @Test
  void subscriptionWithoutConsentIsRejected() throws Exception {
    mvc.perform(post("/api/v1/subscriptions").contentType(MediaType.APPLICATION_JSON)
            .content("{ \"email\": \"a@b.com\", \"language\": \"es\", \"consent\": false }"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors[0].field").value("consent"));
  }
}