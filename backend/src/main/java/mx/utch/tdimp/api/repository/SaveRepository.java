package mx.utch.tdimp.api.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import mx.utch.tdimp.api.model.InventoryItem;
import mx.utch.tdimp.api.model.MilestoneStatus;
import mx.utch.tdimp.api.model.SaveContent;
import mx.utch.tdimp.api.model.SaveRecord;
import mx.utch.tdimp.api.model.SaveStats;
import mx.utch.tdimp.api.model.SaveSummary;

public interface SaveRepository {

  List<SaveSummary> listSummaries(UUID playerId);

  Optional<SaveSummary> findSummary(UUID playerId, int slot);

  Optional<SaveRecord> find(UUID playerId, int slot);

  // Bloquea la ranura mientras se reemplaza (dos dispositivos guardando a la vez).
  Optional<SaveRecord> findForUpdate(UUID playerId, int slot);

  SaveRecord insert(UUID playerId, int slot, SaveContent data);

  SaveRecord update(UUID saveId, SaveContent data);

  // Reemplaza estadísticas, inventario, pickups, objetos e hitos de la ranura.
  void replaceContents(UUID saveId, SaveContent data);

  SaveContent readData(SaveRecord save);

  SaveStats readStats(UUID saveId);

  List<InventoryItem> readInventoryDetail(UUID saveId);

  List<MilestoneStatus> readMilestones(UUID saveId);
}
