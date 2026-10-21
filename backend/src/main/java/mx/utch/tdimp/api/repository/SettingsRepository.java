package mx.utch.tdimp.api.repository;

import java.util.Optional;
import java.util.UUID;
import mx.utch.tdimp.api.dto.SettingsDto;

public interface SettingsRepository {

  void insertDefaults(UUID playerId);

  Optional<SettingsDto> find(UUID playerId);

  SettingsDto upsert(UUID playerId, SettingsDto settings);
}
