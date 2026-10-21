package mx.utch.tdimp.api.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import mx.utch.tdimp.api.dto.SaveDataDto;
import mx.utch.tdimp.api.dto.SaveDetailDto;
import mx.utch.tdimp.api.dto.SaveStatsDto;
import mx.utch.tdimp.api.dto.SaveSummaryDto;
import mx.utch.tdimp.api.model.SaveRecord;

public interface SaveRepository {

  List<SaveSummaryDto> listSummaries(UUID playerId);

  Optional<SaveSummaryDto> findSummary(UUID playerId, int slot);

  Optional<SaveRecord> find(UUID playerId, int slot);

  // Bloquea la ranura mientras se reemplaza (dos dispositivos guardando a la vez).
  Optional<SaveRecord> findForUpdate(UUID playerId, int slot);

  SaveRecord insert(UUID playerId, int slot, SaveDataDto data);

  SaveRecord update(UUID saveId, SaveDataDto data);

  // Reemplaza estadísticas, inventario, pickups, objetos e hitos de la ranura.
  void replaceContents(UUID saveId, SaveDataDto data);

  SaveDataDto readData(SaveRecord save);

  SaveStatsDto readStats(UUID saveId);

  List<SaveDetailDto.Item> readInventoryDetail(UUID saveId);

  List<SaveDetailDto.Milestone> readMilestones(UUID saveId);
}
