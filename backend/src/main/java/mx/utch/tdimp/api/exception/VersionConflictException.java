package mx.utch.tdimp.api.exception;

import java.time.OffsetDateTime;

// 409 VERSION_CONFLICT: otro dispositivo guardó la ranura después de la versión enviada.
public class VersionConflictException extends RuntimeException {

  private final int serverVersion;
  private final OffsetDateTime serverUpdatedAt;

  public VersionConflictException(int serverVersion, OffsetDateTime serverUpdatedAt) {
    super("The slot was saved by another device.");
    this.serverVersion = serverVersion;
    this.serverUpdatedAt = serverUpdatedAt;
  }

  public int serverVersion() {
    return serverVersion;
  }

  public OffsetDateTime serverUpdatedAt() {
    return serverUpdatedAt;
  }
}
