package mx.utch.tdimp.api;

import static mx.utch.tdimp.api.support.ApiTestClient.PASSWORD;
import static mx.utch.tdimp.api.support.ApiTestClient.familyOf;
import static mx.utch.tdimp.api.support.ApiTestClient.json;
import static mx.utch.tdimp.api.support.ApiTestClient.unique;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.UUID;
import mx.utch.tdimp.api.model.ClientType;
import mx.utch.tdimp.api.service.TokenIssuer;
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
import org.springframework.transaction.annotation.Transactional;

/**
 * Cuenta de punta a punta contra PostgreSQL: reautenticación, nombre, contraseña, dispositivos y eliminación.
 * {@code @Transactional} deshace todo lo que crea cada prueba.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AccountApiIntegrationTest {

  @Autowired
  MockMvc mvc;

  @Autowired
  JdbcClient jdbc;

  @Autowired
  TokenIssuer tokens;

  ApiTestClient api;

  @BeforeEach
  void setUp() {
    api = new ApiTestClient(mvc);
  }

  // ----------------------------------------------------------- reauthenticate

  @Test
  void reauthenticateChecksThePasswordAndReturnsOnlyAnAccessToken() throws Exception {
    String id = unique();
    Session felc = api.register("re-" + id + "@example.com", "re_" + id, ClientType.MOBILE);

    mvc.perform(post("/api/v1/auth/reauthenticate").contentType(MediaType.APPLICATION_JSON)
            .content("{ \"password\": \"x\" }"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("TOKEN_EXPIRED"));

    mvc.perform(post("/api/v1/auth/reauthenticate").header(HttpHeaders.AUTHORIZATION, felc.bearer())
            .contentType(MediaType.APPLICATION_JSON).content("{ \"password\": \"wrong-password\" }"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));

    MvcResult ok = mvc.perform(post("/api/v1/auth/reauthenticate").header(HttpHeaders.AUTHORIZATION, felc.bearer())
            .contentType(MediaType.APPLICATION_JSON).content("{ \"password\": \"%s\" }".formatted(PASSWORD)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.refreshToken").doesNotExist())
        .andReturn();
    String access = json(ok, "$.accessToken");
    assertThat(familyOf(access)).isEqualTo(felc.familyId());
  }

  // ------------------------------------------------------------------ profile

  @Test
  void renameRejectsAnotherPlayersNameIgnoringCase() throws Exception {
    String id = unique();
    Session felc = api.register("rn-" + id + "@example.com", "rn_" + id, ClientType.MOBILE);
    api.register("other-" + id + "@example.com", "Taken_" + id, ClientType.MOBILE);

    mvc.perform(patch("/api/v1/account").header(HttpHeaders.AUTHORIZATION, felc.bearer())
            .contentType(MediaType.APPLICATION_JSON).content("{ \"username\": \"Felc_%s\" }".formatted(id)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.username").value("Felc_" + id));

    mvc.perform(patch("/api/v1/account").header(HttpHeaders.AUTHORIZATION, felc.bearer())
            .contentType(MediaType.APPLICATION_JSON).content("{ \"username\": \"TAKEN_%s\" }".formatted(id)))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.code").value("USERNAME_IN_USE"))
        .andExpect(jsonPath("$.errors[0].field").value("username"));

    mvc.perform(patch("/api/v1/account").header(HttpHeaders.AUTHORIZATION, felc.bearer())
            .contentType(MediaType.APPLICATION_JSON).content("{ \"username\": \"no vale\" }"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
  }

  // ----------------------------------------------------------------- password

  @Test
  void changingThePasswordClosesEveryOtherDevice() throws Exception {
    String id = unique();
    String email = "pw-" + id + "@example.com";
    Session phone = api.register(email, "pw_" + id, ClientType.MOBILE);
    Session game = api.login(email, PASSWORD, ClientType.UNITY_PC);

    mvc.perform(put("/api/v1/account/password").header(HttpHeaders.AUTHORIZATION, phone.bearer())
            .contentType(MediaType.APPLICATION_JSON)
            .content("{ \"currentPassword\": \"wrong-password\", \"newPassword\": \"another-long-one\" }"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));

    mvc.perform(put("/api/v1/account/password").header(HttpHeaders.AUTHORIZATION, phone.bearer())
            .contentType(MediaType.APPLICATION_JSON)
            .content("{ \"currentPassword\": \"%s\", \"newPassword\": \"another-long-one\" }".formatted(PASSWORD)))
        .andExpect(status().isNoContent());

    assertThat(api.refreshStatus(game.refreshToken())).isEqualTo(401);   // el juego quedó fuera
    assertThat(api.refreshStatus(phone.refreshToken())).isEqualTo(200);  // este dispositivo sigue dentro
    api.login(email, "another-long-one", ClientType.WEB);                 // la contraseña nueva ya funciona
  }

  // ------------------------------------------------------------------ devices

  @Test
  void devicesListMarksTheCurrentOneAndCanCloseOthers() throws Exception {
    String id = unique();
    String email = "dv-" + id + "@example.com";
    Session phone = api.register(email, "dv_" + id, ClientType.MOBILE);
    Session game = api.login(email, PASSWORD, ClientType.UNITY_PC);

    mvc.perform(get("/api/v1/account/devices").header(HttpHeaders.AUTHORIZATION, game.bearer()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(2))
        .andExpect(jsonPath("$[0].id").value(game.familyId()))
        .andExpect(jsonPath("$[0].current").value(true))
        .andExpect(jsonPath("$[0].description").value("Juego · PC"))
        .andExpect(jsonPath("$[1].id").value(phone.familyId()))
        .andExpect(jsonPath("$[1].current").value(false));

    mvc.perform(delete("/api/v1/account/devices/{id}", phone.familyId()).header(HttpHeaders.AUTHORIZATION, game.bearer()))
        .andExpect(status().isNoContent());
    assertThat(api.refreshStatus(phone.refreshToken())).isEqualTo(401);

    mvc.perform(delete("/api/v1/account/devices/{id}", UUID.randomUUID()).header(HttpHeaders.AUTHORIZATION, game.bearer()))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("NOT_FOUND"));

    Session web = api.login(email, PASSWORD, ClientType.WEB);
    mvc.perform(delete("/api/v1/account/devices").header(HttpHeaders.AUTHORIZATION, web.bearer()))
        .andExpect(status().isNoContent());
    assertThat(api.refreshStatus(game.refreshToken())).isEqualTo(401);

    mvc.perform(get("/api/v1/account/devices").header(HttpHeaders.AUTHORIZATION, web.bearer()))
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].client").value("WEB"));
  }

  @Test
  void aDeviceOfAnotherPlayerCannotBeClosed() throws Exception {
    String id = unique();
    Session felc = api.register("a-" + id + "@example.com", "a_" + id, ClientType.MOBILE);
    Session other = api.register("b-" + id + "@example.com", "b_" + id, ClientType.MOBILE);

    mvc.perform(delete("/api/v1/account/devices/{id}", other.familyId()).header(HttpHeaders.AUTHORIZATION, felc.bearer()))
        .andExpect(status().isNotFound());
    assertThat(api.refreshStatus(other.refreshToken())).isEqualTo(200);
  }

  // --------------------------------------------------------------- deletion

  @Test
  void accountDeletionIsWebOnlyAndNeedsARecentPassword() throws Exception {
    String id = unique();
    String email = "del-" + id + "@example.com";
    Session phone = api.register(email, "del_" + id, ClientType.MOBILE);

    mvc.perform(delete("/api/v1/account").header(HttpHeaders.AUTHORIZATION, phone.bearer()))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("DELETION_WEB_ONLY"));

    Session web = api.login(email, PASSWORD, ClientType.WEB);
    String stale = tokens.issueAccessToken(web.playerUuid(), web.familyUuid(), ClientType.WEB,
        Instant.now().minusSeconds(600));
    mvc.perform(delete("/api/v1/account").header(HttpHeaders.AUTHORIZATION, "Bearer " + stale))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("REAUTHENTICATION_REQUIRED"));

    MvcResult deleted = mvc.perform(delete("/api/v1/account").header(HttpHeaders.AUTHORIZATION, web.bearer()))
        .andExpect(status().isNoContent())
        .andReturn();
    assertThat(deleted.getResponse().getHeader(HttpHeaders.SET_COOKIE)).startsWith("tdimp_rt=").contains("Max-Age=0");

    long players = jdbc.sql("select count(*) from players where id = :id")
        .param("id", web.playerUuid()).query(Long.class).single();
    long sessions = jdbc.sql("select count(*) from auth_sessions where player_id = :id")
        .param("id", web.playerUuid()).query(Long.class).single();
    assertThat(players).isZero();
    assertThat(sessions).isZero();

    mvc.perform(get("/api/v1/account").header(HttpHeaders.AUTHORIZATION, web.bearer()))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("INVALID_SESSION"));
  }
}