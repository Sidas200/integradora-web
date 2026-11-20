package mx.utch.tdimp.api;

import static mx.utch.tdimp.api.support.ApiTestClient.CSRF_HEADER;
import static mx.utch.tdimp.api.support.ApiTestClient.CSRF_VALUE;
import static mx.utch.tdimp.api.support.ApiTestClient.PASSWORD;
import static mx.utch.tdimp.api.support.ApiTestClient.claim;
import static mx.utch.tdimp.api.support.ApiTestClient.json;
import static mx.utch.tdimp.api.support.ApiTestClient.refreshCookie;
import static mx.utch.tdimp.api.support.ApiTestClient.refreshCookieFor;
import static mx.utch.tdimp.api.support.ApiTestClient.refreshCookieHeader;
import static mx.utch.tdimp.api.support.ApiTestClient.unique;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
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
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

/**
 * Authentication end to end against PostgreSQL: how each client receives the refresh token,
 * the anti-CSRF header, rotation with reuse detection, logout and the Bearer check of private routes.
 * {@code @Transactional} rolls back what each test writes.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthApiIntegrationTest {

  @Autowired
  MockMvc mvc;

  @Autowired
  JdbcClient jdbc;

  ApiTestClient api;

  @BeforeEach
  void setUp() {
    api = new ApiTestClient(mvc);
  }

  private MvcResult registerRaw(String email, String username, ClientType client) throws Exception {
    return mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
            { "email": "%s", "username": "%s", "password": "%s", "acceptedPrivacyNotice": true, "client": "%s" }
            """.formatted(email, username, PASSWORD, client.name())))
        .andExpect(status().isCreated())
        .andReturn();
  }

  /** POST /auth/refresh the way the PWA does it: cookie + anti-CSRF header, no body. */
  private MvcResult webRefresh(String cookieValue) throws Exception {
    return mvc.perform(post("/api/v1/auth/refresh").cookie(refreshCookieFor(cookieValue)).header(CSRF_HEADER, CSRF_VALUE))
        .andReturn();
  }

  private MvcResult nativeRefresh(String refreshToken) throws Exception {
    return mvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON)
            .content("{ \"refreshToken\": \"%s\" }".formatted(refreshToken)))
        .andReturn();
  }

  private long activeSessionsOf(UUID familyId) {
    return jdbc.sql("select count(*) from auth_sessions where family_id = :family and revoked_at is null")
        .param("family", familyId).query(Long.class).single();
  }

  // ------------------------------------------------- delivery of the refresh token

  @Test
  void theWebGetsTheRefreshTokenOnlyInAStrictHttpOnlyCookie() throws Exception {
    String id = unique();
    MvcResult result = registerRaw("web-" + id + "@example.com", "web_" + id, ClientType.WEB);

    assertThat(result.getResponse().getContentAsString()).doesNotContain("refreshToken");
    assertThat(result.getResponse().getHeader(HttpHeaders.CACHE_CONTROL)).contains("no-store");
    String cookie = refreshCookieHeader(result);
    assertThat(cookie).isNotNull()
        .contains("HttpOnly")
        .contains("Secure")
        .contains("SameSite=Strict")
        .contains("Path=/api/v1/auth")
        .contains("Max-Age=2592000"); // 30 days
    assertThat(refreshCookie(result)).hasSize(43);
  }

  @Test
  void theGameAndTheMobileAppGetTheRefreshTokenInTheJson() throws Exception {
    String id = unique();
    MvcResult result = registerRaw("app-" + id + "@example.com", "app_" + id, ClientType.MOBILE);
    String access = json(result, "$.accessToken");

    assertThat(refreshCookieHeader(result)).isNull();
    assertThat((String) json(result, "$.refreshToken")).hasSize(43);
    assertThat((String) json(result, "$.tokenType")).isEqualTo("Bearer");
    assertThat(((Number) json(result, "$.expiresInSec")).longValue()).isEqualTo(900L);
    assertThat((String) claim(access, "$.cli")).isEqualTo("MOBILE");

    Session game = api.login("app-" + id + "@example.com", PASSWORD, ClientType.UNITY_PC);
    assertThat(game.refreshToken()).hasSize(43);
    assertThat((String) claim(game.accessToken(), "$.cli")).isEqualTo("UNITY_PC");
  }

  // ------------------------------------------------------------- web refresh

  @Test
  void theWebRefreshNeedsTheAntiCsrfHeaderAndRotatesTheCookie() throws Exception {
    Session web = api.newPlayer("csrf", ClientType.WEB);

    // A form on another site can send the cookie but cannot add the header.
    mvc.perform(post("/api/v1/auth/refresh").cookie(refreshCookieFor(web.refreshToken())))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("INVALID_SESSION"));

    MvcResult refreshed = webRefresh(web.refreshToken());
    assertThat(refreshed.getResponse().getStatus()).isEqualTo(200);
    assertThat(refreshed.getResponse().getContentAsString()).doesNotContain("refreshToken");
    String rotated = refreshCookie(refreshed);
    assertThat(rotated).hasSize(43).isNotEqualTo(web.refreshToken());
    // Same device: the session family does not change.
    assertThat(ApiTestClient.familyOf(json(refreshed, "$.accessToken"))).isEqualTo(web.familyId());
  }

  @Test
  void aRefreshWithoutAnyTokenIsInvalidSession() throws Exception {
    mvc.perform(post("/api/v1/auth/refresh"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("INVALID_SESSION"));

    mvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON).content("{ \"refreshToken\": \"short\" }"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
        .andExpect(jsonPath("$.errors[0].field").value("refreshToken"));
  }

  // ------------------------------------------------ rotation and reuse detection

  @Test
  void reusingARotatedRefreshTokenClosesTheWholeDevice() throws Exception {
    Session phone = api.newPlayer("reuse", ClientType.MOBILE);

    MvcResult first = nativeRefresh(phone.refreshToken());
    assertThat(first.getResponse().getStatus()).isEqualTo(200);
    String second = json(first, "$.refreshToken");
    assertThat(second).isNotEqualTo(phone.refreshToken());
    assertThat(activeSessionsOf(phone.familyUuid())).isEqualTo(1);

    // Someone presents the old token again: possible theft, the whole chain is revoked.
    MvcResult reused = nativeRefresh(phone.refreshToken());
    assertThat(reused.getResponse().getStatus()).isEqualTo(401);
    assertThat(activeSessionsOf(phone.familyUuid())).isZero();
    assertThat(nativeRefresh(second).getResponse().getStatus()).isEqualTo(401);

    long reuseRows = jdbc.sql("""
            select count(*) from auth_sessions
            where family_id = :family and revocation_reason = 'REUSE_DETECTED'
            """)
        .param("family", phone.familyUuid()).query(Long.class).single();
    assertThat(reuseRows).isEqualTo(1);
  }

  // ------------------------------------------------------------------ logout

  @Test
  void webLogoutClosesTheSessionAndClearsTheCookie() throws Exception {
    Session web = api.newPlayer("out", ClientType.WEB);

    MvcResult logout = mvc.perform(post("/api/v1/auth/logout").cookie(refreshCookieFor(web.refreshToken()))
            .header(CSRF_HEADER, CSRF_VALUE))
        .andExpect(status().isNoContent())
        .andReturn();

    assertThat(refreshCookieHeader(logout)).contains("Max-Age=0");
    assertThat(refreshCookie(logout)).isEmpty();
    assertThat(webRefresh(web.refreshToken()).getResponse().getStatus()).isEqualTo(401);
  }

  @Test
  void nativeLogoutClosesOnlyThatDevice() throws Exception {
    String id = unique();
    String email = "nl-" + id + "@example.com";
    Session phone = api.register(email, "nl_" + id, ClientType.MOBILE);
    Session game = api.login(email, PASSWORD, ClientType.UNITY_PC);

    mvc.perform(post("/api/v1/auth/logout").contentType(MediaType.APPLICATION_JSON)
            .content("{ \"refreshToken\": \"%s\" }".formatted(phone.refreshToken())))
        .andExpect(status().isNoContent());

    assertThat(api.refreshStatus(phone.refreshToken())).isEqualTo(401);
    assertThat(api.refreshStatus(game.refreshToken())).isEqualTo(200);
  }

  @Test
  void logoutWithoutATokenStillAnswersNoContent() throws Exception {
    mvc.perform(post("/api/v1/auth/logout"))
        .andExpect(status().isNoContent());
  }

  // ---------------------------------------------------------------- register

  @Test
  void registerValidatesTheBodyAndRejectsDuplicatesIgnoringCase() throws Exception {
    String id = unique();
    api.register("dup-" + id + "@example.com", "dup_" + id, ClientType.WEB);

    mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
            { "email": "DUP-%s@Example.com", "username": "other_%s", "password": "%s", "acceptedPrivacyNotice": true, "client": "WEB" }
            """.formatted(id, id, PASSWORD)))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.code").value("EMAIL_IN_USE"))
        .andExpect(jsonPath("$.errors[0].field").value("email"));

    mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
            { "email": "new-%s@example.com", "username": "u_%s", "password": "short", "acceptedPrivacyNotice": true, "client": "WEB" }
            """.formatted(id, id)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
        .andExpect(jsonPath("$.errors[0].field").value("password"));

    mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
            { "email": "new-%s@example.com", "username": "u_%s", "password": "%s", "acceptedPrivacyNotice": false, "client": "WEB" }
            """.formatted(id, id, PASSWORD)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors[0].field").value("acceptedPrivacyNotice"));

    mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
            { "email": "new-%s@example.com", "username": "u_%s", "password": "%s", "acceptedPrivacyNotice": true, "client": "UNITY_PC" }
            """.formatted(id, id, PASSWORD)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
        .andExpect(jsonPath("$.errors[0].field").value("client"));

    long created = jdbc.sql("select count(*) from players where email = :email")
        .param("email", "new-" + id + "@example.com").query(Long.class).single();
    assertThat(created).isZero();
  }

  @Test
  void registerCreatesTheDefaultSettingsOfThePlayer() throws Exception {
    Session felc = api.newPlayer("cfg", ClientType.MOBILE);

    long settings = jdbc.sql("select count(*) from settings where player_id = :id")
        .param("id", felc.playerUuid()).query(Long.class).single();
    assertThat(settings).isEqualTo(1);
  }

  // ------------------------------------------------------------------- login

  @Test
  void loginIgnoresTheCaseOfTheEmailAndGivesOneErrorForBothMistakes() throws Exception {
    String id = unique();
    api.register("case-" + id + "@example.com", "case_" + id, ClientType.WEB);

    api.login("CASE-" + id + "@EXAMPLE.com", PASSWORD, ClientType.MOBILE);

    mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content("{ \"email\": \"case-%s@example.com\", \"password\": \"wrong-password\", \"client\": \"WEB\" }".formatted(id)))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));

    mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content("{ \"email\": \"nobody-%s@example.com\", \"password\": \"%s\", \"client\": \"WEB\" }".formatted(id, PASSWORD)))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
  }

  // ---------------------------------------------------- Bearer on private routes

  @Test
  void privateRoutesNeedAValidBearerToken() throws Exception {
    mvc.perform(get("/api/v1/account"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("TOKEN_EXPIRED"));

    mvc.perform(get("/api/v1/account").header(HttpHeaders.AUTHORIZATION, "Basic ZmVsYzpzZWNyZXQ="))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("TOKEN_EXPIRED"));

    mvc.perform(get("/api/v1/account").header(HttpHeaders.AUTHORIZATION, "Bearer not-a-real-token"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("INVALID_SESSION"))
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));

    Session felc = api.newPlayer("bearer", ClientType.MOBILE);
    mvc.perform(get("/api/v1/account").header(HttpHeaders.AUTHORIZATION, felc.bearer()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(felc.playerId()));
  }

  @Test
  void publicRoutesIgnoreTheAuthorizationHeader() throws Exception {
    mvc.perform(get("/api/v1/news").header(HttpHeaders.AUTHORIZATION, "Bearer not-a-real-token"))
        .andExpect(status().isOk());
    mvc.perform(get("/api/v1/achievements").header(HttpHeaders.AUTHORIZATION, "Bearer not-a-real-token"))
        .andExpect(status().isOk());
  }
}