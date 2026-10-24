package mx.utch.tdimp.api.model;

import java.time.OffsetDateTime;

/** An achievement of the catalog as one player sees it. unlockedAt is null while locked. */
public record PlayerAchievement(Achievement achievement, OffsetDateTime unlockedAt) {

  public boolean unlocked() {
    return unlockedAt != null;
  }
}
