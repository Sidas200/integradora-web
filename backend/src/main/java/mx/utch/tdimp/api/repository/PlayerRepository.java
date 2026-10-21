package mx.utch.tdimp.api.repository;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import mx.utch.tdimp.api.model.Player;

public interface PlayerRepository {

  Optional<Player> findByEmail(String email);

  Optional<Player> findById(UUID id);

  boolean emailExists(String email);

  boolean usernameExists(String username);

  Player insert(String email, String username, String passwordHash, OffsetDateTime privacyAcceptedAt);

  void touchLastLogin(UUID id, OffsetDateTime at);
}
