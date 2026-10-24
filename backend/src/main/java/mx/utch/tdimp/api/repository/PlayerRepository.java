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

  // Igual que usernameExists, sin contar al propio jugador: "felc" → "Felc" no es un conflicto.
  boolean usernameTakenByOther(UUID id, String username);

  Player insert(String email, String username, String passwordHash, OffsetDateTime privacyAcceptedAt);

  void touchLastLogin(UUID id, OffsetDateTime at);

  // Lanza DuplicateKeyException (ux_players_username) si otro jugador lo tomó al mismo tiempo.
  Optional<Player> updateUsername(UUID id, String username);

  void updatePasswordHash(UUID id, String passwordHash);

  // Borra la cuenta; las llaves foráneas borran en cascada sesiones, partidas, logros y configuración.
  boolean delete(UUID id);
}