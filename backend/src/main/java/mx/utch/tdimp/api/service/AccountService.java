package mx.utch.tdimp.api.service;

import java.util.List;
import java.util.UUID;
import mx.utch.tdimp.api.dto.AccountDto;
import mx.utch.tdimp.api.dto.DeviceDto;
import mx.utch.tdimp.api.dto.HistoryItemDto;
import mx.utch.tdimp.api.dto.PageQuery;
import mx.utch.tdimp.api.dto.PageResult;
import mx.utch.tdimp.api.dto.PlaySessionDto;
import mx.utch.tdimp.api.dto.SettingsDto;

public interface AccountService {

  AccountDto account(UUID playerId);

  // 409 USERNAME_IN_USE si otro jugador ya lo usa (sin importar mayúsculas).
  AccountDto rename(UUID playerId, String username);

  // 401 INVALID_CREDENTIALS si la contraseña actual no coincide. Cierra la sesión en los demás dispositivos.
  void changePassword(AccessClaims claims, String currentPassword, String newPassword);

  List<DeviceDto> devices(AccessClaims claims);

  // 404 si el dispositivo no existe, ya se cerró o es de otro jugador.
  void revokeDevice(AccessClaims claims, UUID deviceId);

  void revokeOtherDevices(AccessClaims claims);

  // 403 DELETION_WEB_ONLY fuera de la web; 401 REAUTHENTICATION_REQUIRED si la contraseña no se confirmó hace poco.
  void deleteAccount(AccessClaims claims);

  SettingsDto settings(UUID playerId);

  SettingsDto replaceSettings(UUID playerId, SettingsDto settings);

  PageResult<PlaySessionDto> sessions(UUID playerId, Integer slot, PageQuery page);

  PageResult<HistoryItemDto> history(UUID playerId, String type, PageQuery page);
}