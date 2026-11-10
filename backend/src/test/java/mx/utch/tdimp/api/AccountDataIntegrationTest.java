package mx.utch.tdimp.api;

import static mx.utch.tdimp.api.support.ApiTestClient.PASSWORD;
import static mx.utch.tdimp.api.support.ApiTestClient.json;
import static mx.utch.tdimp.api.support.ApiTestClient.unique;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;
import mx.utch.tdimp.api.model.ClientType;
import mx.utch.tdimp.api.support.ApiTestClient;
import mx.utch.tdimp.api.support.ApiTestClient.Session;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

/**
 * What the PWA reads from /account against PostgreSQL: settings, the summary of the v_player_summary view,
 * the player's achievements, the v_player_history timeline, play sessions and the cascade of a deletion.
 * {@code @Transactional} rolls back what each test writes.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AccountDataIntegrationTest {

  private static final String SAVE = """
      {
        "version": 0, "activeCharacter": "TSUKI", "currentChapter": 1, "currentScene": "Zone1_Forest",
        "stats": { "playTimeSec": %d, "enemiesDefeated": %d, "deaths": 0, "materialsCollected": 4, "itemsCrafted": %d },
        "inventory": [], "collectedPickups": [], "objects": [],
        "completedMilestones": %s,
        "extraData": { "v": 1 }
      }
      """;
  private static final String TWO_MILESTONES = """
      [ { "milestoneId": "woke_up", "playTimeSec": 300, "completedAt": "2026-11-09T16:00:00Z" },
        { "milestoneId": "has_sword", "playTimeSec": 900, "completedAt": "2026-11-09T17:00:00Z" } ]""";

  @Autowired
  MockMvc mvc;

  @Autowired
  JdbcClient jdbc;

  ApiTestClient api;

  @BeforeEach
  void setUp() {
    api = new ApiTestClient(mvc);
  }

  // --------------------------------------------------------------- helpers

  /** Web and game sessions of one new player (account created on the web). */
  private record Player(Session web, Session game) {
  }

  private Player newPlayer(String prefix) throws Exception {
    String id = unique();
    String email = prefix + "-" + id + "@example.com";
    Session web = api.register(email, prefix + "_" + id, ClientType.WEB);
    return new Player(web, api.login(email, PASSWORD, ClientType.UNITY_PC));
  }

  private ResultActions getAs(Session session, String path, Object... vars) throws Exception {
    return mvc.perform(get("/api/v1/account" + path, vars).header(HttpHeaders.AUTHORIZATION, session.bearer()));
  }

  private ResultActions sendAs(Session session, MockHttpServletRequestBuilder request, String body) throws Exception {
    return mvc.perform(request.header(HttpHeaders.AUTHORIZATION, session.bearer())
        .contentType(MediaType.APPLICATION_JSON).content(body));
  }

  private void save(Session game, int slot, int playTime, int enemies, int crafted, String milestones) throws Exception {
    sendAs(game, put("/api/v1/account/saves/{slot}/data", slot), SAVE.formatted(playTime, enemies, crafted, milestones))
        .andExpect(status().isOk());
  }

  private void session(Session game, int slot, UUID id, String startedAt, String endedAt, int durationSec) throws Exception {
    sendAs(game, post("/api/v1/account/saves/{slot}/sessions", slot), """
        [ { "id": "%s", "startedAt": "%s", "endedAt": "%s", "durationSec": %d, "platform": "WINDOWS" } ]
        """.formatted(id, startedAt, endedAt, durationSec))
        .andExpect(status().isOk());
  }

  private ResultActions unlock(Session game, String achievementId, String unlockedAt) throws Exception {
    return sendAs(game, put("/api/v1/account/achievements/{id}", achievementId),
        "{ \"unlockedAt\": \"%s\" }".formatted(unlockedAt));
  }

  private int count(String sql, UUID id) {
    return jdbc.sql(sql).param("id", id).query(Integer.class).single();
  }

  // -------------------------------------------------------------- settings

  @Test
  void settingsStartWithTheDefaultsAndAreReplacedAsAWhole() throws Exception {
    Player felc = newPlayer("set");

    getAs(felc.web(), "/settings")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.musicVolume").value(80))
        .andExpect(jsonPath("$.sfxVolume").value(80))
        .andExpect(jsonPath("$.language").value("es"))
        .andExpect(jsonPath("$.fullscreen").value(true));

    sendAs(felc.game(), put("/api/v1/account/settings"), """
        { "musicVolume": 30, "sfxVolume": 55, "language": "en", "fullscreen": false, "controls": { "attack": "J" } }
        """)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.musicVolume").value(30))
        .andExpect(jsonPath("$.updatedAt").isNotEmpty());

    // What the game saved is what the web reads.
    getAs(felc.web(), "/settings")
        .andExpect(jsonPath("$.sfxVolume").value(55))
        .andExpect(jsonPath("$.language").value("en"))
        .andExpect(jsonPath("$.fullscreen").value(false))
        .andExpect(jsonPath("$.controls.attack").value("J"));

    sendAs(felc.web(), put("/api/v1/account/settings"), """
        { "musicVolume": 101, "sfxVolume": 55, "language": "fr", "fullscreen": false, "controls": {} }
        """)
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
  }

  // --------------------------------------------------------------- summary

  @Test
  void theAccountSummaryAddsUpEverySlot() throws Exception {
    Player felc = newPlayer("sum");
    int achievementsInCatalog = jdbc.sql("select count(*) from achievements").query(Integer.class).single();

    getAs(felc.web(), "")
        .andExpect(jsonPath("$.summary.saves").value(0))
        .andExpect(jsonPath("$.summary.playTimeSec").value(0))
        .andExpect(jsonPath("$.summary.lastSessionAt").isEmpty());

    save(felc.game(), 1, 6000, 50, 2, "[]");
    save(felc.game(), 2, 1200, 11, 1, "[]");
    session(felc.game(), 1, UUID.randomUUID(), "2026-11-09T16:00:00Z", "2026-11-09T16:30:00Z", 1800);
    unlock(felc.game(), "first_craft", "2026-11-09T16:10:00Z").andExpect(status().isCreated());

    getAs(felc.web(), "")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.summary.saves").value(2))
        .andExpect(jsonPath("$.summary.playTimeSec").value(7200))
        .andExpect(jsonPath("$.summary.enemiesDefeated").value(61))
        .andExpect(jsonPath("$.summary.itemsCrafted").value(3))
        .andExpect(jsonPath("$.summary.achievementsUnlocked").value(1))
        .andExpect(jsonPath("$.summary.achievementsTotal").value(achievementsInCatalog))
        .andExpect(jsonPath("$.summary.lastSessionAt").isNotEmpty());
  }

  // ---------------------------------------------------------- achievements

  @Test
  void unlockingAnAchievementIsIdempotentAndRevealsHiddenOnes() throws Exception {
    Player felc = newPlayer("ach");
    int achievementsInCatalog = jdbc.sql("select count(*) from achievements").query(Integer.class).single();

    getAs(felc.web(), "/achievements")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(achievementsInCatalog))
        .andExpect(jsonPath("$[?(@.id == 'rulebreaker')].name").value("Logro oculto"))
        .andExpect(jsonPath("$[?(@.id == 'rulebreaker')].unlocked").value(false));

    MvcResult first = unlock(felc.game(), "rulebreaker", "2026-11-09T16:00:00Z")
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.unlocked").value(true))
        .andExpect(jsonPath("$.name").value("Rulebreaker"))
        .andReturn();
    String firstDate = json(first, "$.unlockedAt");

    // The game sends it again (another PC, a retry): 200 and the first date stays.
    MvcResult again = unlock(felc.game(), "rulebreaker", "2026-11-10T09:00:00Z")
        .andExpect(status().isOk())
        .andReturn();
    assertThat((String) json(again, "$.unlockedAt")).isEqualTo(firstDate);

    getAs(felc.web(), "/achievements")
        .andExpect(jsonPath("$[?(@.id == 'rulebreaker')].name").value("Rulebreaker"))
        .andExpect(jsonPath("$[?(@.id == 'rulebreaker')].unlocked").value(true));
  }

  @Test
  void onlyAchievementsOfTheCatalogCanBeUnlocked() throws Exception {
    Player felc = newPlayer("achbad");

    unlock(felc.game(), "not_in_catalog", "2026-11-09T16:00:00Z")
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("NOT_FOUND"));

    unlock(felc.game(), "Not-Valid", "2026-11-09T16:00:00Z")
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors[0].field").value("achievementId"));

    sendAs(felc.game(), put("/api/v1/account/achievements/{id}", "first_craft"), "{}")
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors[0].field").value("unlockedAt"));
  }

  // --------------------------------------------------------------- history

  @Test
  void theHistoryJoinsSessionsAchievementsAndMilestonesNewestFirst() throws Exception {
    Player felc = newPlayer("his");
    UUID sessionId = UUID.randomUUID();
    save(felc.game(), 1, 6000, 10, 0, TWO_MILESTONES);                                   // milestones at 16:00 and 17:00
    session(felc.game(), 1, sessionId, "2026-11-09T17:30:00Z", "2026-11-09T18:00:00Z", 1800); // session ends at 18:00
    unlock(felc.game(), "first_craft", "2026-11-09T19:00:00Z").andExpect(status().isCreated());

    getAs(felc.web(), "/history")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.page.totalElements").value(4))
        .andExpect(jsonPath("$.content[0].type").value("ACHIEVEMENT"))
        .andExpect(jsonPath("$.content[0].referenceId").value("first_craft"))
        .andExpect(jsonPath("$.content[0].title").value("El poder se fabrica"))
        .andExpect(jsonPath("$.content[1].type").value("SESSION"))
        .andExpect(jsonPath("$.content[1].referenceId").value(sessionId.toString()))
        .andExpect(jsonPath("$.content[1].slot").value(1))
        .andExpect(jsonPath("$.content[1].valueSec").value(1800))
        .andExpect(jsonPath("$.content[2].referenceId").value("has_sword"))
        .andExpect(jsonPath("$.content[3].referenceId").value("woke_up"))
        .andExpect(jsonPath("$.content[3].valueSec").value(300));

    getAs(felc.web(), "/history?type=MILESTONE")
        .andExpect(jsonPath("$.page.totalElements").value(2))
        .andExpect(jsonPath("$.content[0].type").value("MILESTONE"));

    getAs(felc.web(), "/history?page=1&size=3")
        .andExpect(jsonPath("$.content.length()").value(1))
        .andExpect(jsonPath("$.page.number").value(1))
        .andExpect(jsonPath("$.page.totalPages").value(2));
  }

  @Test
  void historyAndSessionsRejectInvalidParameters() throws Exception {
    Player felc = newPlayer("hisbad");

    for (String query : List.of("/history?type=BOSS", "/history?size=51", "/history?size=0", "/history?page=-1",
        "/sessions?slot=4", "/sessions?size=51")) {
      getAs(felc.web(), query)
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }
  }

  @Test
  void sessionsCanBeFilteredBySlot() throws Exception {
    Player felc = newPlayer("ses");
    save(felc.game(), 1, 100, 0, 0, "[]");
    save(felc.game(), 2, 100, 0, 0, "[]");
    session(felc.game(), 1, UUID.randomUUID(), "2026-11-09T10:00:00Z", "2026-11-09T10:30:00Z", 1800);
    session(felc.game(), 1, UUID.randomUUID(), "2026-11-09T12:00:00Z", "2026-11-09T12:20:00Z", 1200);
    UUID inSlot2 = UUID.randomUUID();
    session(felc.game(), 2, inSlot2, "2026-11-09T14:00:00Z", "2026-11-09T14:10:00Z", 600);

    getAs(felc.web(), "/sessions")
        .andExpect(jsonPath("$.page.totalElements").value(3))
        .andExpect(jsonPath("$.content[0].id").value(inSlot2.toString())); // newest first

    getAs(felc.web(), "/sessions?slot=2")
        .andExpect(jsonPath("$.page.totalElements").value(1))
        .andExpect(jsonPath("$.content[0].slot").value(2))
        .andExpect(jsonPath("$.content[0].platform").value("WINDOWS"));
  }

  @Test
  void aPlayerNeverSeesTheHistoryOfAnother() throws Exception {
    Player felc = newPlayer("mine");
    Player other = newPlayer("theirs");
    save(felc.game(), 1, 100, 0, 0, TWO_MILESTONES);
    unlock(felc.game(), "first_craft", "2026-11-09T19:00:00Z").andExpect(status().isCreated());

    getAs(other.web(), "/history").andExpect(jsonPath("$.page.totalElements").value(0));
    getAs(other.web(), "/sessions").andExpect(jsonPath("$.page.totalElements").value(0));
    getAs(other.web(), "").andExpect(jsonPath("$.summary.achievementsUnlocked").value(0));
  }

  // ------------------------------------------------------------- deletion

  @Test
  void deletingTheAccountRemovesEverythingOfThePlayer() throws Exception {
    Player felc = newPlayer("gone");
    save(felc.game(), 1, 100, 0, 0, TWO_MILESTONES);
    session(felc.game(), 1, UUID.randomUUID(), "2026-11-09T10:00:00Z", "2026-11-09T10:30:00Z", 1800);
    unlock(felc.game(), "first_craft", "2026-11-09T19:00:00Z").andExpect(status().isCreated());
    UUID player = felc.web().playerUuid();
    UUID saveId = jdbc.sql("select id from saves where player_id = :id").param("id", player).query(UUID.class).single();

    // The web login just happened, so its auth_time is inside the 5-minute window.
    mvc.perform(delete("/api/v1/account").header(HttpHeaders.AUTHORIZATION, felc.web().bearer()))
        .andExpect(status().isNoContent());

    assertThat(count("select count(*) from players where id = :id", player)).isZero();
    assertThat(count("select count(*) from settings where player_id = :id", player)).isZero();
    assertThat(count("select count(*) from auth_sessions where player_id = :id", player)).isZero();
    assertThat(count("select count(*) from player_achievements where player_id = :id", player)).isZero();
    assertThat(count("select count(*) from saves where player_id = :id", player)).isZero();
    assertThat(count("select count(*) from save_stats where save_id = :id", saveId)).isZero();
    assertThat(count("select count(*) from story_progress where save_id = :id", saveId)).isZero();
    assertThat(count("select count(*) from play_sessions where save_id = :id", saveId)).isZero();

    // The game's token was still valid, but the account no longer exists.
    getAs(felc.game(), "").andExpect(status().isUnauthorized());
  }
}