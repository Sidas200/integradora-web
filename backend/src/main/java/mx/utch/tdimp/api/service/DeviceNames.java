package mx.utch.tdimp.api.service;

import java.util.Locale;
import mx.utch.tdimp.api.model.ClientType;

/**
 * "Chrome · Windows" a partir del User-Agent, para que el jugador reconozca sus dispositivos.
 * Es solo una etiqueta: el User-Agent lo manda el cliente y no sirve para tomar decisiones de seguridad.
 */
final class DeviceNames {

  private DeviceNames() {
  }

  static String describe(ClientType client, String userAgent) {
    if (client == ClientType.UNITY_PC) {
      return "Juego · PC";
    }
    if (userAgent == null || userAgent.isBlank()) {
      return client == ClientType.MOBILE ? "App móvil" : "Navegador";
    }
    String ua = userAgent.toLowerCase(Locale.ROOT);
    String app = client == ClientType.MOBILE ? "App móvil" : browser(ua);
    String system = system(ua);
    return system == null ? app : app + " · " + system;
  }

  // El orden importa: Edge y Opera también dicen "chrome", y Chrome también dice "safari".
  private static String browser(String ua) {
    if (ua.contains("edg/")) return "Edge";
    if (ua.contains("opr/") || ua.contains("opera")) return "Opera";
    if (ua.contains("samsungbrowser")) return "Samsung Internet";
    if (ua.contains("firefox/") || ua.contains("fxios")) return "Firefox";
    if (ua.contains("chrome/") || ua.contains("crios")) return "Chrome";
    if (ua.contains("safari/")) return "Safari";
    return "Navegador";
  }

  private static String system(String ua) {
    if (ua.contains("windows")) return "Windows";
    if (ua.contains("android")) return "Android";
    if (ua.contains("iphone") || ua.contains("ipad")) return "iOS";
    if (ua.contains("mac os") || ua.contains("macintosh")) return "macOS";
    if (ua.contains("cros")) return "ChromeOS";
    if (ua.contains("linux")) return "Linux";
    return null;
  }
}