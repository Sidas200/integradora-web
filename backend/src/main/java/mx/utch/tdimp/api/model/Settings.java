package mx.utch.tdimp.api.model;

import java.time.OffsetDateTime;
import java.util.Map;

/** Game settings of a player (one row per player). */
public record Settings(
    int musicVolume,
    int sfxVolume,
    String language,
    boolean fullscreen,
    Map<String, String> controls,
    OffsetDateTime updatedAt) {
}
