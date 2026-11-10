package mx.utch.tdimp.api;

import static mx.utch.tdimp.api.support.ApiTestClient.PASSWORD;
import static mx.utch.tdimp.api.support.ApiTestClient.unique;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import mx.utch.tdimp.api.support.ApiTestClient;
import mx.utch.tdimp.api.support.ApiTestClient.Session;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

/**
 * The attempt limit end to end. Profile test turns it off; this class turns it on with small limits.
 * The limiter lives in memory and is not rolled back with the transaction, so each test uses its own
 * client address (and its own emails) and the tests never block each other.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "tdimp.rate-limit.enabled=true",
    "tdimp.rate-limit.login.max-attempts=3",
    "tdimp.rate-limit.register.max-attempts=2",
    "tdimp.rate-limit.reauthenticate.max-attempts=2",
    "tdimp.rate-limit.subscriptions.max-attempts=2"
})
@Transactional
class RateLimitIntegrationTest {

  @Autowired
  MockMvc mvc;

  // --------------------------------------------------------------- helpers

  private ResultActions register(String ip, String email, String username) throws Exception {
    return mvc.perform(post("/api/v1/auth/register").with(from(ip)).contentType(MediaType.APPLICATION_JSON).content("""
        { "email": "%s", "username": "%s", "password": "%s", "acceptedPrivacyNotice": true, "client": "MOBILE" }
        """.formatted(email, username, PASSWORD)));
  }

  private Session newPlayer(String ip) throws Exception {
    String id = unique();
    MvcResult result = register(ip, "rl-" + id + "@example.com", "rl_" + id).andExpect(status().isCreated()).andReturn();
    return ApiTestClient.session(result);
  }

  private ResultActions login(String ip, String email, String password) throws Exception {
    return mvc.perform(post("/api/v1/auth/login").with(from(ip)).contentType(MediaType.APPLICATION_JSON)
        .content("{ \"email\": \"%s\", \"password\": \"%s\", \"client\": \"WEB\" }".formatted(email, password)));
  }

  private ResultActions subscribe(String ip) throws Exception {
    return mvc.perform(post("/api/v1/subscriptions").with(from(ip)).contentType(MediaType.APPLICATION_JSON)
        .content("{ \"email\": \"rl-%s@example.com\", \"language\": \"es\", \"consent\": true }".formatted(unique())));
  }

  private ResultActions reauthenticate(Session session, String password) throws Exception {
    return mvc.perform(post("/api/v1/auth/reauthenticate").header(HttpHeaders.AUTHORIZATION, session.bearer())
        .contentType(MediaType.APPLICATION_JSON).content("{ \"password\": \"%s\" }".formatted(password)));
  }

  private static RequestPostProcessor from(String ip) {
    return request -> {
      request.setRemoteAddr(ip);
      return request;
    };
  }

  /** 429 with the stable code and a Retry-After between 1 second and the window. */
  private static void assertBlocked(ResultActions actions, long maxSeconds) throws Exception {
    MvcResult result = actions
        .andExpect(status().isTooManyRequests())
        .andExpect(jsonPath("$.code").value("TOO_MANY_ATTEMPTS"))
        .andReturn();
    long retryAfter = Long.parseLong(result.getResponse().getHeader(HttpHeaders.RETRY_AFTER));
    assertThat(retryAfter).isBetween(1L, maxSeconds);
  }

  // ------------------------------------------------------------------ login

  @Test
  void loginIsBlockedAfterTooManyFailuresAndASuccessResetsTheCount() throws Exception {
    String id = unique();
    String email = "login-" + id + "@example.com";
    register("10.0.1.100", email, "login_" + id).andExpect(status().isCreated());

    login("10.0.1.1", email, "wrong-password").andExpect(status().isUnauthorized());
    login("10.0.1.1", email, "wrong-password").andExpect(status().isUnauthorized());
    login("10.0.1.1", email, PASSWORD).andExpect(status().isOk()); // a success clears the two failures

    login("10.0.1.1", email, "wrong-password").andExpect(status().isUnauthorized());
    login("10.0.1.1", email, "wrong-password").andExpect(status().isUnauthorized());
    login("10.0.1.1", email, "wrong-password").andExpect(status().isUnauthorized());
    // Fourth attempt in the window: blocked even with the right password, and the email case does not help.
    assertBlocked(login("10.0.1.1", email.toUpperCase(), PASSWORD), 900);

    // The limit is per address + email: the player can still enter from another network.
    login("10.0.1.2", email, PASSWORD).andExpect(status().isOk());
  }

  // --------------------------------------------------------------- register

  @Test
  void registerIsLimitedPerAddressAndRejectedBodiesDoNotCount() throws Exception {
    newPlayer("10.0.2.1");
    newPlayer("10.0.2.1");
    String id = unique();
    assertBlocked(register("10.0.2.1", "third-" + id + "@example.com", "third_" + id), 3600);

    newPlayer("10.0.2.2");

    // A body that fails validation never reaches the limit.
    for (int i = 0; i < 3; i++) {
      register("10.0.2.3", "not-an-email", "bad_" + i).andExpect(status().isBadRequest());
    }
    newPlayer("10.0.2.3");
  }

  // ----------------------------------------------------------- subscriptions

  @Test
  void theLaunchNoticeIsLimitedPerAddress() throws Exception {
    subscribe("10.0.3.1").andExpect(status().isAccepted());
    subscribe("10.0.3.1").andExpect(status().isAccepted());
    assertBlocked(subscribe("10.0.3.1"), 3600);

    subscribe("10.0.3.2").andExpect(status().isAccepted());
  }

  @Test
  void behindTheProxyTheAddressComesFromXForwardedFor() throws Exception {
    // Render and Vercel forward the real client in X-Forwarded-For; every request arrives from the same proxy.
    for (int i = 0; i < 2; i++) {
      mvc.perform(post("/api/v1/subscriptions").with(from("10.0.9.9")).header("X-Forwarded-For", "203.0.113.7")
              .contentType(MediaType.APPLICATION_JSON)
              .content("{ \"email\": \"xff-%s@example.com\", \"language\": \"es\", \"consent\": true }".formatted(unique())))
          .andExpect(status().isAccepted());
    }
    assertBlocked(mvc.perform(post("/api/v1/subscriptions").with(from("10.0.9.9")).header("X-Forwarded-For", "203.0.113.7")
        .contentType(MediaType.APPLICATION_JSON)
        .content("{ \"email\": \"xff-%s@example.com\", \"language\": \"es\", \"consent\": true }".formatted(unique()))), 3600);

    // Another client behind the same proxy is not affected.
    mvc.perform(post("/api/v1/subscriptions").with(from("10.0.9.9")).header("X-Forwarded-For", "203.0.113.8")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{ \"email\": \"xff-%s@example.com\", \"language\": \"es\", \"consent\": true }".formatted(unique())))
        .andExpect(status().isAccepted());
  }

  // --------------------------------------------------------- reauthenticate

  @Test
  void reauthenticationIsLimitedPerPlayerAndASuccessResetsTheCount() throws Exception {
    Session felc = newPlayer("10.0.4.1");
    Session other = newPlayer("10.0.4.2");

    reauthenticate(felc, "wrong-password").andExpect(status().isUnauthorized());
    reauthenticate(felc, PASSWORD).andExpect(status().isOk()); // clears the failure
    reauthenticate(felc, "wrong-password").andExpect(status().isUnauthorized());
    reauthenticate(felc, "wrong-password").andExpect(status().isUnauthorized());
    assertBlocked(reauthenticate(felc, PASSWORD), 900);

    reauthenticate(other, PASSWORD).andExpect(status().isOk());
  }

  // ------------------------------------------------------------ not limited

  @Test
  void refreshingTheSessionHasNoAttemptLimit() throws Exception {
    for (int i = 0; i < 6; i++) {
      mvc.perform(post("/api/v1/auth/refresh").with(from("10.0.5.1")).contentType(MediaType.APPLICATION_JSON)
              .content("{ \"refreshToken\": \"%s\" }".formatted("x".repeat(43))))
          .andExpect(status().isUnauthorized());
    }
  }
}