package mx.utch.tdimp.api.service;

import static org.assertj.core.api.Assertions.assertThat;

import mx.utch.tdimp.api.model.ClientType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/** Unit tests of DeviceNames: the label the player sees in the list of devices. */
class DeviceNamesTest {

  @ParameterizedTest(name = "{0} -> {1}")
  @CsvSource(delimiter = '|', textBlock = """
      Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36            | Chrome · Windows
      Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36 Edg/130.0   | Edge · Windows
      Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36 OPR/115.0   | Opera · Windows
      Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 SamsungBrowser/26.0 Chrome/122.0       | Samsung Internet · Android
      Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5; rv:132.0) Gecko/20100101 Firefox/132.0                 | Firefox · macOS
      Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Safari/604.1 | Safari · iOS
      Mozilla/5.0 (X11; CrOS x86_64 15917.0.0) AppleWebKit/537.36 Chrome/130.0 Safari/537.36              | Chrome · ChromeOS
      Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0                             | Firefox · Linux
      curl/8.5.0                                                                                          | Navegador
      """)
  void theWebLabelNamesTheBrowserAndTheSystem(String userAgent, String expected) {
    assertThat(DeviceNames.describe(ClientType.WEB, userAgent)).isEqualTo(expected);
  }

  @Test
  void theGameIsAlwaysThePc() {
    assertThat(DeviceNames.describe(ClientType.UNITY_PC, null)).isEqualTo("Juego · PC");
    assertThat(DeviceNames.describe(ClientType.UNITY_PC, "UnityPlayer/6000.6.2f1")).isEqualTo("Juego · PC");
  }

  @Test
  void theMobileAppKeepsItsNameAndAddsTheSystem() {
    assertThat(DeviceNames.describe(ClientType.MOBILE, "Dart/3.5 (dart:io) Android 14")).isEqualTo("App móvil · Android");
    assertThat(DeviceNames.describe(ClientType.MOBILE, "Dart/3.5 (dart:io)")).isEqualTo("App móvil");
  }

  @Test
  void withoutUserAgentOnlyTheKindOfClientIsShown() {
    assertThat(DeviceNames.describe(ClientType.WEB, null)).isEqualTo("Navegador");
    assertThat(DeviceNames.describe(ClientType.WEB, "  ")).isEqualTo("Navegador");
    assertThat(DeviceNames.describe(ClientType.MOBILE, null)).isEqualTo("App móvil");
  }
}