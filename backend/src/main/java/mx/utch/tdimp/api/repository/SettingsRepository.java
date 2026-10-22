package mx.utch.tdimp.api.repository;

import java.util.Optional;
import java.util.UUID;
import mx.utch.tdimp.api.model.Settings;

public interface SettingsRepository {

  void insertDefaults(UUID playerId);

  Optional<Settings> find(UUID playerId);

  Settings upsert(UUID playerId, Settings settings);
}
