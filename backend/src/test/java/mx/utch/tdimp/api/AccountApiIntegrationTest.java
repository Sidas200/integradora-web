package mx.utch.tdimp.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;
import mx.utch.tdimp.api.model.ClientType;
import mx.utch.tdimp.api.service.TokenIssuer;
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

  private static final String PASSWORD = "a-long-passphrase";

  @Autowired
  MockMvc mvc;

  @Autowired
  JdbcClient jdbc;

  @Autowired
  TokenIssuer tokens;

  // ------------------------------------------------------------------ helpers

  private record Login(String accessToken, String refreshToken, String playerId, String familyId) {
  }

  private static String unique() {
    return UUID.randomUUID().toString().replace("-", "").substring(0, 8);
  }

  private static String json(MvcResult result, String path) throws Exception {
    return JsonPath.read(result.getResponse().getContentAsString(), path);
  }

  // sid del access token = id de la familia (el "dispositivo").
  private static String familyOf(String accessToken) {
    String payload = new String(Base64.getUrlDecoder().decode(accessToken.split("\\.")[1]), StandardCharsets.UTF_8);
    return JsonPath.read(payload, "$.sid");
  }

  private static Login login(MvcResult result) throws Exception {
    String access = json(result, "$.accessToken");
    String refresh = result.getResponse().getContentAsString().contains("refreshToken") ? json(result, "$.refreshToken") : null;
    return new Login(access, refresh, json(result, "$.player.id"), familyOf(access));
  }

  private Login register(String email, String username, String client) throws Exception {
    MvcResult result = mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
            { "email": "%s", "username": "%s", "password": "%s", "acceptedPrivacyNotice": true, "client": "%s" }
            """.formatted(email, username, PASSWORD, client)))
        .andExpect(status().isCreated())
        .andReturn();
    return login(result);
  }

  private Login loginAgain(String email, String password, String client) throws Exception {
    MvcResult result = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content("{ \"email\": \"%s\", \"password\": \"%s\", \"client\": \"%s\" }".formatted(email, password, client)))
        .andExpect(status().isOk())
        .andReturn();
    return login(result);
  }

  private static String bearer(Login login) {
    return "Bearer " + login.accessToken();
  }

  private int refreshStatus(String refreshToken) throws Exception {
    return mvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON)
            .content("{ \"refreshToken\": \"%s\" }".formatted(refreshToken)))
        .andReturn().getResponse().getStatus();
  }

  // ----------------------------------------------------------- reauthenticate

  @Test
  void reauthenticateChecksThePasswordAndReturnsOnlyAnAccessToken() throws Exception {
    String id = unique();
    Login felc = register("re-" + id + "@example.com", "re_" + id, "MOBILE");

    mvc.perform(post("/api/v1/auth/reauthenticate").contentType(MediaType.APPLICATION_JSON)
            .content("{ \"password\": \"x\" }"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("TOKEN_EXPIRED"));

    mvc.perform(post("/api/v1/auth/reauthenticate").header(HttpHeaders.AUTHORIZATION, bearer(felc))
            .contentType(MediaType.APPLICATION_JSON).content("{ \"password\": \"wrong-password\" }"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));

    MvcResult ok = mvc.perform(post("/api/v1/auth/reauthenticate").header(HttpHeaders.AUTHORIZATION, bearer(felc))
            .contentType(MediaType.APPLICATION_JSON).content("{ \"password\": \"%s\" }".formatted(PASSWORD)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.refreshToken").doesNotExist())
        .andReturn();
    assertThat(familyOf(json(ok, "$.accessToken"))).isEqualTo(felc.familyId());
  }

  // ------------------------------------------------------------------ profile

  @Test
  void renameRejectsAnotherPlayersNameIgnoringCase() throws Exception {
    String id = unique();
    Login felc = register("rn-" + id + "@example.com", "rn_" + id, "MOBILE");
    register("other-" + id + "@example.com", "Taken_" + id, "MOBILE");

    mvc.perform(patch("/api/v1/account").header(HttpHeaders.AUTHORIZATION, bearer(felc))
            .contentType(MediaType.APPLICATION_JSON).content("{ \"username\": \"Felc_%s\" }".formatted(id)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.username").value("Felc_" + id));

    mvc.perform(patch("/api/v1/account").header(HttpHeaders.AUTHORIZATION, bearer(felc))
            .contentType(MediaType.APPLICATION_JSON).content("{ \"username\": \"TAKEN_%s\" }".formatted(id)))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.code").value("USERNAME_IN_USE"))
        .andExpect(jsonPath("$.errors[0].field").value("username"));

    mvc.perform(patch("/api/v1/account").header(HttpHeaders.AUTHORIZATION, bearer(felc))
            .contentType(MediaType.APPLICATION_JSON).content("{ \"username\": \"no vale\" }"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
  }

  // ----------------------------------------------------------------- password

  @Test
  void changingThePasswordClosesEveryOtherDevice() throws Exception {
    String id = unique();
    String email = "pw-" + id + "@example.com";
    Login phone = register(email, "pw_" + id, "MOBILE");
    Login game = loginAgain(email, PASSWORD, "UNITY_PC");

    mvc.perform(put("/api/v1/account/password").header(HttpHeaders.AUTHORIZATION, bearer(phone))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{ \"currentPassword\": \"wrong-password\", \"newPassword\": \"another-long-one\" }"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));

    mvc.perform(put("/api/v1/account/password").header(HttpHeaders.AUTHORIZATION, bearer(phone))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{ \"currentPassword\": \"%s\", \"newPassword\": \"another-long-one\" }".formatted(PASSWORD)))
        .andExpect(status().isNoContent());

    assertThat(refreshStatus(game.refreshToken())).isEqualTo(401);   // el juego quedó fuera
    assertThat(refreshStatus(phone.refreshToken())).isEqualTo(200);  // este dispositivo sigue dentro
    loginAgain(email, "another-long-one", "WEB");                    // la contraseña nueva ya funciona
  }

  // ------------------------------------------------------------------ devices

  @Test
  void devicesListMarksTheCurrentOneAndCanCloseOthers() throws Exception {
    String id = unique();
    String email = "dv-" + id + "@example.com";
    Login phone = register(email, "dv_" + id, "MOBILE");
    Login game = loginAgain(email, PASSWORD, "UNITY_PC");

    mvc.perform(get("/api/v1/account/devices").header(HttpHeaders.AUTHORIZATION, bearer(game)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(2))
        .andExpect(jsonPath("$[0].id").value(game.familyId()))
        .andExpect(jsonPath("$[0].current").value(true))
        .andExpect(jsonPath("$[0].description").value("Juego · PC"))
        .andExpect(jsonPath("$[1].id").value(phone.familyId()))
        .andExpect(jsonPath("$[1].current").value(false));

    mvc.perform(delete("/api/v1/account/devices/{id}", phone.familyId()).header(HttpHeaders.AUTHORIZATION, bearer(game)))
        .andExpect(status().isNoContent());
    assertThat(refreshStatus(phone.refreshToken())).isEqualTo(401);

    mvc.perform(delete("/api/v1/account/devices/{id}", UUID.randomUUID()).header(HttpHeaders.AUTHORIZATION, bearer(game)))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("NOT_FOUND"));

    Login web = loginAgain(email, PASSWORD, "WEB");
    mvc.perform(delete("/api/v1/account/devices").header(HttpHeaders.AUTHORIZATION, bearer(web)))
        .andExpect(status().isNoContent());
    assertThat(refreshStatus(game.refreshToken())).isEqualTo(401);

    mvc.perform(get("/api/v1/account/devices").header(HttpHeaders.AUTHORIZATION, bearer(web)))
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].client").value("WEB"));
  }

  @Test
  void aDeviceOfAnotherPlayerCannotBeClosed() throws Exception {
    String id = unique();
    Login felc = register("a-" + id + "@example.com", "a_" + id, "MOBILE");
    Login other = register("b-" + id + "@example.com", "b_" + id, "MOBILE");

    mvc.perform(delete("/api/v1/account/devices/{id}", other.familyId()).header(HttpHeaders.AUTHORIZATION, bearer(felc)))
        .andExpect(status().isNotFound());
    assertThat(refreshStatus(other.refreshToken())).isEqualTo(200);
  }

  // --------------------------------------------------------------- deletion

  @Test
  void accountDeletionIsWebOnlyAndNeedsARecentPassword() throws Exception {
    String id = unique();
    String email = "del-" + id + "@example.com";
    Login phone = register(email, "del_" + id, "MOBILE");

    mvc.perform(delete("/api/v1/account").header(HttpHeaders.AUTHORIZATION, bearer(phone)))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("DELETION_WEB_ONLY"));

    Login web = loginAgain(email, PASSWORD, "WEB");
    String stale = tokens.issueAccessToken(UUID.fromString(web.playerId()), UUID.fromString(web.familyId()),
        ClientType.WEB, Instant.now().minusSeconds(600));
    mvc.perform(delete("/api/v1/account").header(HttpHeaders.AUTHORIZATION, "Bearer " + stale))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("REAUTHENTICATION_REQUIRED"));

    MvcResult deleted = mvc.perform(delete("/api/v1/account").header(HttpHeaders.AUTHORIZATION, bearer(web)))
        .andExpect(status().isNoContent())
        .andReturn();
    assertThat(deleted.getResponse().getHeader(HttpHeaders.SET_COOKIE)).startsWith("tdimp_rt=").contains("Max-Age=0");

    long players = jdbc.sql("select count(*) from players where id = :id")
        .param("id", UUID.fromString(web.playerId())).query(Long.class).single();
    long sessions = jdbc.sql("select count(*) from auth_sessions where player_id = :id")
        .param("id", UUID.fromString(web.playerId())).query(Long.class).single();
    assertThat(players).isZero();
    assertThat(sessions).isZero();

    mvc.perform(get("/api/v1/account").header(HttpHeaders.AUTHORIZATION, bearer(web)))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("INVALID_SESSION"));
  }
}