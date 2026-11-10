package mx.utch.tdimp.api.support;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import jakarta.servlet.http.Cookie;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.UUID;
import mx.utch.tdimp.api.model.ClientType;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * Helpers shared by the integration tests: create players, log in and read the tokens.
 * It is not a Spring bean: each test builds it with its own MockMvc ({@code new ApiTestClient(mvc)}).
 */
public final class ApiTestClient {

  /** Password of every player created by the tests. */
  public static final String PASSWORD = "a-long-passphrase";
  /** Cookie where the API delivers the refresh token to the WEB client (CookieRefreshChannel). */
  public static final String REFRESH_COOKIE = "tdimp_rt";
  /** Anti-CSRF header the PWA sends when it uses the refresh cookie. */
  public static final String CSRF_HEADER = "X-Requested-With";
  public static final String CSRF_VALUE = "tdimp-pwa";

  private final MockMvc mvc;

  public ApiTestClient(MockMvc mvc) {
    this.mvc = mvc;
  }

  /**
   * What a client keeps after register or login. {@code refreshToken} comes from the JSON body
   * (UNITY_PC, MOBILE) or from the {@code tdimp_rt} cookie (WEB). {@code familyId} is the "device".
   */
  public record Session(String accessToken, String refreshToken, String playerId, String familyId) {

    public String bearer() {
      return "Bearer " + accessToken;
    }

    public UUID playerUuid() {
      return UUID.fromString(playerId);
    }

    public UUID familyUuid() {
      return UUID.fromString(familyId);
    }
  }

  // ------------------------------------------------------------------ players

  /** 8 random characters so each test uses its own email and username. */
  public static String unique() {
    return UUID.randomUUID().toString().replace("-", "").substring(0, 8);
  }

  public Session register(String email, String username, ClientType client) throws Exception {
    MvcResult result = mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
            { "email": "%s", "username": "%s", "password": "%s", "acceptedPrivacyNotice": true, "client": "%s" }
            """.formatted(email, username, PASSWORD, client.name())))
        .andExpect(status().isCreated())
        .andReturn();
    return session(result);
  }

  /**
   * Registers a new player with an email and username that no other test uses.
   * The username is {@code prefix_xxxxxxxx}: the prefix can have up to 11 characters (limit of 20).
   */
  public Session newPlayer(String prefix, ClientType client) throws Exception {
    String id = unique();
    return register(prefix + "-" + id + "@example.com", prefix + "_" + id, client);
  }

  public Session login(String email, String password, ClientType client) throws Exception {
    MvcResult result = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content("{ \"email\": \"%s\", \"password\": \"%s\", \"client\": \"%s\" }".formatted(email, password, client.name())))
        .andExpect(status().isOk())
        .andReturn();
    return session(result);
  }

  /** Status of POST /auth/refresh with the token in the body (the channel of the game and the mobile app). */
  public int refreshStatus(String refreshToken) throws Exception {
    return mvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON)
            .content("{ \"refreshToken\": \"%s\" }".formatted(refreshToken)))
        .andReturn().getResponse().getStatus();
  }

  // ------------------------------------------------------------ reading results

  public static Session session(MvcResult result) throws Exception {
    String access = json(result, "$.accessToken");
    String body = result.getResponse().getContentAsString();
    String refresh = body.contains("\"refreshToken\"") ? json(result, "$.refreshToken") : refreshCookie(result);
    return new Session(access, refresh, json(result, "$.player.id"), familyOf(access));
  }

  /** Value of the tdimp_rt cookie, or null if the response did not set it. */
  public static String refreshCookie(MvcResult result) {
    Cookie cookie = result.getResponse().getCookie(REFRESH_COOKIE);
    return cookie == null ? null : cookie.getValue();
  }

  public static <T> T json(MvcResult result, String path) throws Exception {
    return JsonPath.read(result.getResponse().getContentAsString(), path);
  }

  /** {@code sid} claim of the access token = id of the session family (the "device"). */
  public static String familyOf(String accessToken) {
    return claim(accessToken, "$.sid");
  }

  /** Reads a claim of the access token without checking the signature (the API already did). */
  public static <T> T claim(String accessToken, String path) {
    String payload = new String(Base64.getUrlDecoder().decode(accessToken.split("\\.")[1]), StandardCharsets.UTF_8);
    return JsonPath.read(payload, path);
  }
}