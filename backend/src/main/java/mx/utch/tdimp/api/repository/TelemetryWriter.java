package mx.utch.tdimp.api.repository;

import java.util.List;
import java.util.UUID;
import mx.utch.tdimp.api.dto.EventInput;
import mx.utch.tdimp.api.dto.PlaySessionInput;

public interface TelemetryWriter {

  // Devuelven cuántas filas eran nuevas; las repetidas (mismo id) se ignoran.
  int insertSessions(UUID saveId, List<PlaySessionInput> sessions);

  int insertEvents(UUID saveId, List<EventInput> events);
}
