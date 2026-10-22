package mx.utch.tdimp.api.repository;

import java.util.List;
import java.util.UUID;
import mx.utch.tdimp.api.model.GameEvent;
import mx.utch.tdimp.api.model.PlaySession;

public interface TelemetryWriter {

  // Devuelven cuántas filas eran nuevas; las repetidas (mismo id) se ignoran.
  int insertSessions(UUID saveId, List<PlaySession> sessions);

  int insertEvents(UUID saveId, List<GameEvent> events);
}
