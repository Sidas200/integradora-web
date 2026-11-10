package mx.utch.tdimp.api;

import static mx.utch.tdimp.api.support.ApiTestClient.PASSWORD;
import static mx.utch.tdimp.api.support.ApiTestClient.unique;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

/**
 * Cloud saves end to end against PostgreSQL: the game uploads and downloads its document with
 * optimistic versioning, the web reads summaries and details, and telemetry batches are idempotent.
 * {@code @Transactional} rolls back what each test writes.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SaveApiIntegrationTest {

  private static final String TWO_ITEMS = """
      [ { "itemId": "flor_destello", "quantity": 5 }, { "itemId": "resto_slime", "quantity": 2 } ]""";
  private static final String ONE_ITEM = """
      [ { "itemId": "resto_slime", "quantity": 9 } ]""";
  private static final String TWO_MILESTONES = """
      [ { "milestoneId": "woke_up", "playTimeSec": 300, "completedAt": "2026-11-09T16:00:00Z" },
        { "milestoneId": "has_sword", "playTimeSec": 900, "completedAt": "2026-11-09T17:00:00Z" } ]""";
  private static final String NO_MILESTONES = "[]";
  private static final String FORMAT_V1 = "{ \"v\": 1 }";

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

  /** The JSON document Unity sends in PUT /account/saves/{slot}/data. */
  private static String document(int version, String inventory, String milestones, String extraData) {
    return """
        {
          "version": %d, "activeCharacter": "TSUKI", "currentChapter": 1, "currentScene": "Zone1_Forest",
          "position": { "x": 12.5, "y": -3.25 }, "health": 80,
          "stats": { "playTimeSec": 6720, "enemiesDefeated": 61, "deaths": 3, "materialsCollected": 40, "itemsCrafted": 2 },
          "inventory": %s,
          "collectedPickups": [ "zone1:pickup_01" ],
          "objects": [ { "objectId": "zone1:chest_01", "state": "OPENED" } ],
          "completedMilestones": %s,
          "extraData": %s
        }
        """.formatted(version, inventory, milestones, extraData);
  }

  private static String standardDocument(int version) {
    return document(version, TWO_ITEMS, TWO_MILESTONES, FORMAT_V1);
  }

  private ResultActions upload(Session session, int slot, String body) throws Exception {
    return mvc.perform(put("/api/v1/account/saves/{slot}/data", slot).header(HttpHeaders.AUTHORIZATION, session.bearer())
        .contentType(MediaType.APPLICATION_JSON).content(body));
  }

  private ResultActions read(Session session, String path, Object... vars) throws Exception {
    return mvc.perform(get("/api/v1/account/saves" + path, vars).header(HttpHeaders.AUTHORIZATION, session.bearer()));
  }

  private ResultActions postBatch(Session session, int slot, String kind, String body) throws Exception {
    return mvc.perform(post("/api/v1/account/saves/{slot}/" + kind, slot).header(HttpHeaders.AUTHORIZATION, session.bearer())
        .contentType(MediaType.APPLICATION_JSON).content(body));
  }

  /** A player with the account created on the phone and the game logged in on the PC. */
  private Session gameOfNewPlayer(String prefix) throws Exception {
    String id = unique();
    String email = prefix + "-" + id + "@example.com";
    api.register(email, prefix + "_" + id, ClientType.MOBILE);
    return api.login(email, PASSWORD, ClientType.UNITY_PC);
  }

  private int milestonesInCatalog() {
    return jdbc.sql("select count(*) from story_milestones").query(Integer.class).single();
  }

  // ------------------------------------------------------------ the game saves

  @Test
  void theGameUploadsAndDownloadsTheWholeDocument() throws Exception {
    Session game = gameOfNewPlayer("doc");

    upload(game, 1, standardDocument(0))
        .andExpect(status().isOk())
        .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"))
        .andExpect(jsonPath("$.version").value(1))
        .andExpect(jsonPath("$.updatedAt").isNotEmpty());

    read(game, "/{slot}/data", 1)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.version").value(1))
        .andExpect(jsonPath("$.activeCharacter").value("TSUKI"))
        .andExpect(jsonPath("$.currentScene").value("Zone1_Forest"))
        .andExpect(jsonPath("$.position.x").value(12.5))
        .andExpect(jsonPath("$.health").value(80))
        .andExpect(jsonPath("$.stats.enemiesDefeated").value(61))
        .andExpect(jsonPath("$.inventory.length()").value(2))
        .andExpect(jsonPath("$.inventory[0].itemId").value("flor_destello"))
        .andExpect(jsonPath("$.inventory[0].quantity").value(5))
        .andExpect(jsonPath("$.collectedPickups[0]").value("zone1:pickup_01"))
        .andExpect(jsonPath("$.objects[0].state").value("OPENED"))
        .andExpect(jsonPath("$.completedMilestones.length()").value(2))
        .andExpect(jsonPath("$.completedMilestones[0].milestoneId").value("woke_up"))
        .andExpect(jsonPath("$.extraData.v").value(1));
  }

  @Test
  void eachSaveMustBringTheCurrentVersionAndReplacesTheContents() throws Exception {
    Session game = gameOfNewPlayer("ver");

    upload(game, 1, standardDocument(0)).andExpect(jsonPath("$.version").value(1));

    // Another PC still has version 0: it must download before saving.
    upload(game, 1, standardDocument(0))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.code").value("VERSION_CONFLICT"))
        .andExpect(jsonPath("$.serverVersion").value(1))
        .andExpect(jsonPath("$.serverUpdatedAt").isNotEmpty());

    upload(game, 1, document(1, ONE_ITEM, NO_MILESTONES, FORMAT_V1))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.version").value(2));

    read(game, "/{slot}/data", 1)
        .andExpect(jsonPath("$.version").value(2))
        .andExpect(jsonPath("$.inventory.length()").value(1))
        .andExpect(jsonPath("$.inventory[0].itemId").value("resto_slime"))
        .andExpect(jsonPath("$.inventory[0].quantity").value(9))
        .andExpect(jsonPath("$.completedMilestones.length()").value(0));
  }

  // ---------------------------------------------------------- the web reads

  @Test
  void theWebSeesTheSummaryOfEachSlotAndItsDetail() throws Exception {
    String id = unique();
    String email = "web-" + id + "@example.com";
    Session web = api.register(email, "web_" + id, ClientType.WEB);
    Session game = api.login(email, PASSWORD, ClientType.UNITY_PC);
    int total = milestonesInCatalog();

    upload(game, 1, standardDocument(0)).andExpect(status().isOk());
    upload(game, 3, document(0, ONE_ITEM, NO_MILESTONES, FORMAT_V1)).andExpect(status().isOk());

    read(web, "")
        .andExpect(status().isOk())
        .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"))
        .andExpect(jsonPath("$.length()").value(2))
        .andExpect(jsonPath("$[0].slot").value(1))
        .andExpect(jsonPath("$[0].lastMilestone.id").value("has_sword"))
        .andExpect(jsonPath("$[0].milestonesCompleted").value(2))
        .andExpect(jsonPath("$[0].milestonesTotal").value(total))
        .andExpect(jsonPath("$[0].playTimeSec").value(6720))
        .andExpect(jsonPath("$[1].slot").value(3))
        .andExpect(jsonPath("$[1].lastMilestone").isEmpty())
        .andExpect(jsonPath("$[1].milestonesCompleted").value(0));

    read(web, "/{slot}", 1)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.slot").value(1))
        .andExpect(jsonPath("$.version").value(1))
        .andExpect(jsonPath("$.stats.deaths").value(3))
        .andExpect(jsonPath("$.inventory.length()").value(2))
        .andExpect(jsonPath("$.inventory[?(@.itemId == 'flor_destello')].name").value("Flor destello"))
        .andExpect(jsonPath("$.inventory[?(@.itemId == 'flor_destello')].quantity").value(5))
        .andExpect(jsonPath("$.milestones.length()").value(total))
        .andExpect(jsonPath("$.milestones[?(@.id == 'woke_up')].title").value("El despertar"));
  }

  @Test
  void emptySlotsAreNotFoundAndSlotsOutsideOneToThreeAreInvalid() throws Exception {
    Session game = gameOfNewPlayer("slot");

    read(game, "").andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));

    read(game, "/{slot}", 2)
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    read(game, "/{slot}/data", 2)
        .andExpect(status().isNotFound());

    read(game, "/{slot}", 4)
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
        .andExpect(jsonPath("$.errors[0].field").value("slot"));
    upload(game, 0, standardDocument(0))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors[0].field").value("slot"));
  }

  @Test
  void invalidDocumentsAreRejectedAndNothingIsStored() throws Exception {
    Session game = gameOfNewPlayer("bad");

    upload(game, 1, document(0, "[ { \"itemId\": \"golden_apple\", \"quantity\": 1 } ]", NO_MILESTONES, FORMAT_V1))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors[0].field").value("inventory"))
        .andExpect(jsonPath("$.errors[0].code").value("UnknownItem"));

    upload(game, 1, document(0, """
        [ { "itemId": "resto_slime", "quantity": 1 }, { "itemId": "resto_slime", "quantity": 2 } ]""", NO_MILESTONES, FORMAT_V1))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors[0].code").value("Duplicate"));

    upload(game, 1, document(0, TWO_ITEMS, """
        [ { "milestoneId": "not_a_milestone", "completedAt": "2026-11-09T16:00:00Z" } ]""", FORMAT_V1))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors[0].field").value("completedMilestones"));

    upload(game, 1, document(0, TWO_ITEMS, NO_MILESTONES, "{}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors[0].field").value("extraData.v"));

    upload(game, 1, standardDocument(0).replace("\"TSUKI\"", "\"AOI\""))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
        .andExpect(jsonPath("$.errors[0].field").value("activeCharacter"));

    read(game, "").andExpect(jsonPath("$.length()").value(0));
  }

  // -------------------------------------------------------------- telemetry

  @Test
  void sessionsAndEventsAreStoredOncePerIdSentByTheGame() throws Exception {
    Session game = gameOfNewPlayer("tel");
    upload(game, 1, standardDocument(0)).andExpect(status().isOk());
    UUID first = UUID.randomUUID();
    UUID second = UUID.randomUUID();
    String twoSessions = """
        [ { "id": "%s", "startedAt": "2026-11-09T16:00:00Z", "endedAt": "2026-11-09T16:30:00Z", "durationSec": 1680,
            "platform": "WINDOWS", "gameVersion": "1.0.0" },
          { "id": "%s", "startedAt": "2026-11-09T17:00:00Z", "endedAt": "2026-11-09T17:10:00Z", "durationSec": 590,
            "platform": "WINDOWS", "gameVersion": "1.0.0" } ]
        """.formatted(first, second);

    postBatch(game, 1, "sessions", twoSessions)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.accepted").value(2))
        .andExpect(jsonPath("$.duplicates").value(0));
    // The game lost the connection and sends the same batch again: nothing is duplicated.
    postBatch(game, 1, "sessions", twoSessions)
        .andExpect(jsonPath("$.accepted").value(0))
        .andExpect(jsonPath("$.duplicates").value(2));

    long stored = jdbc.sql("""
            select count(*) from play_sessions ps join saves s on s.id = ps.save_id where s.player_id = :player
            """).param("player", game.playerUuid()).query(Long.class).single();
    assertThat(stored).isEqualTo(2);

    String events = """
        [ { "id": "%s", "type": "ENEMY_DEFEATED", "data": { "enemy": "slime" }, "occurredAt": "2026-11-09T16:05:00Z" },
          { "id": "%s", "type": "DEATH", "occurredAt": "2026-11-09T16:06:00Z" } ]
        """.formatted(UUID.randomUUID(), UUID.randomUUID());
    postBatch(game, 1, "events", events)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.accepted").value(2))
        .andExpect(jsonPath("$.duplicates").value(0));
  }

  @Test
  void invalidTelemetryBatchesAreRejectedWithTheIndexOfTheBadElement() throws Exception {
    Session game = gameOfNewPlayer("badtel");
    upload(game, 1, standardDocument(0)).andExpect(status().isOk());

    postBatch(game, 1, "sessions", "[]")
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors[0].field").value("body"));

    postBatch(game, 1, "sessions", """
        [ { "id": "%s", "startedAt": "2026-11-09T16:30:00Z", "endedAt": "2026-11-09T16:00:00Z", "durationSec": 0,
            "platform": "WINDOWS" } ]
        """.formatted(UUID.randomUUID()))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors[0].field").value("[0].endedAt"));

    postBatch(game, 1, "sessions", """
        [ { "id": "%s", "startedAt": "2026-11-09T16:00:00Z", "endedAt": "2026-11-09T16:30:00Z", "durationSec": 1,
            "platform": "PS5" } ]
        """.formatted(UUID.randomUUID()))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors[0].field").value("[0].platform"));

    postBatch(game, 1, "events", """
        [ { "id": "%s", "type": "DANCED", "occurredAt": "2026-11-09T16:00:00Z" } ]
        """.formatted(UUID.randomUUID()))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors[0].field").value("[0].type"));

    postBatch(game, 3, "events", """
        [ { "id": "%s", "type": "DEATH", "occurredAt": "2026-11-09T16:00:00Z" } ]
        """.formatted(UUID.randomUUID()))
        .andExpect(status().isNotFound());
  }

  // ---------------------------------------------------------------- isolation

  @Test
  void eachPlayerOnlyReadsAndWritesHisOwnSlots() throws Exception {
    Session felc = gameOfNewPlayer("own");
    Session other = gameOfNewPlayer("other");

    upload(felc, 1, standardDocument(0)).andExpect(jsonPath("$.version").value(1));

    read(other, "").andExpect(jsonPath("$.length()").value(0));
    read(other, "/{slot}", 1).andExpect(status().isNotFound());
    read(other, "/{slot}/data", 1).andExpect(status().isNotFound());
    // Slot 1 of the other player is a different slot: version 0 is accepted, there is no conflict.
    upload(other, 1, document(0, ONE_ITEM, NO_MILESTONES, FORMAT_V1)).andExpect(jsonPath("$.version").value(1));

    read(felc, "/{slot}/data", 1)
        .andExpect(jsonPath("$.inventory.length()").value(2))
        .andExpect(jsonPath("$.version").value(1));
  }
}