package mx.utch.tdimp.api.controller;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import mx.utch.tdimp.api.dto.AccountDto;
import mx.utch.tdimp.api.dto.ChangePasswordRequest;
import mx.utch.tdimp.api.dto.DeviceDto;
import mx.utch.tdimp.api.dto.HistoryItemDto;
import mx.utch.tdimp.api.dto.PageQuery;
import mx.utch.tdimp.api.dto.PageResult;
import mx.utch.tdimp.api.dto.PlayerAchievementDto;
import mx.utch.tdimp.api.dto.PlaySessionDto;
import mx.utch.tdimp.api.dto.SettingsDto;
import mx.utch.tdimp.api.dto.UnlockAchievementRequest;
import mx.utch.tdimp.api.dto.UpdateAccountRequest;
import mx.utch.tdimp.api.exception.InvalidParameterException;
import mx.utch.tdimp.api.service.AccessClaims;
import mx.utch.tdimp.api.service.AccountService;
import mx.utch.tdimp.api.service.AchievementService;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/account")
class AccountController {

  private static final String ACHIEVEMENT_ID = "^[a-z0-9_]{2,40}$";
  private static final List<String> HISTORY_TYPES = List.of("SESSION", "ACHIEVEMENT", "MILESTONE");

  private final AccountService account;
  private final AchievementService achievements;
  private final List<RefreshChannel> channels;

  AccountController(AccountService account, AchievementService achievements, List<RefreshChannel> channels) {
    this.account = account;
    this.achievements = achievements;
    this.channels = channels;
  }

  // ---------------------------------------------------------------- profile

  @GetMapping
  ResponseEntity<AccountDto> get(AccessClaims claims) {
    return privately(account.account(claims.playerId()));
  }

  @PatchMapping
  ResponseEntity<AccountDto> update(AccessClaims claims, @Valid @RequestBody UpdateAccountRequest request) {
    return privately(account.rename(claims.playerId(), request.username()));
  }

  // Solo desde la web y con la contraseña confirmada hace 5 minutos o menos (POST /auth/reauthenticate).
  @DeleteMapping
  ResponseEntity<Void> delete(AccessClaims claims, HttpServletResponse response) {
    account.deleteAccount(claims);
    channels.forEach(c -> c.clear(response));
    return ResponseEntity.noContent().build();
  }

  // --------------------------------------------------------------- security

  @PutMapping("/password")
  ResponseEntity<Void> changePassword(AccessClaims claims, @Valid @RequestBody ChangePasswordRequest request) {
    account.changePassword(claims, request.currentPassword(), request.newPassword());
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/devices")
  ResponseEntity<List<DeviceDto>> devices(AccessClaims claims) {
    return privately(account.devices(claims));
  }

  @DeleteMapping("/devices")
  ResponseEntity<Void> revokeOtherDevices(AccessClaims claims) {
    account.revokeOtherDevices(claims);
    return ResponseEntity.noContent().build();
  }

  @DeleteMapping("/devices/{id}")
  ResponseEntity<Void> revokeDevice(AccessClaims claims, @PathVariable UUID id) {
    account.revokeDevice(claims, id);
    return ResponseEntity.noContent().build();
  }

  // --------------------------------------------------------------- settings

  @GetMapping("/settings")
  ResponseEntity<SettingsDto> settings(AccessClaims claims) {
    return privately(account.settings(claims.playerId()));
  }

  @PutMapping("/settings")
  ResponseEntity<SettingsDto> replaceSettings(AccessClaims claims, @Valid @RequestBody SettingsDto settings) {
    return privately(account.replaceSettings(claims.playerId(), settings));
  }

  // ---------------------------------------------------------------- history

  @GetMapping("/sessions")
  ResponseEntity<PageResult<PlaySessionDto>> sessions(AccessClaims claims,
                                                      @RequestParam(defaultValue = "0") int page,
                                                      @RequestParam(defaultValue = "20") int size,
                                                      @RequestParam(required = false) Integer slot) {
    if (slot != null) {
      Slots.check(slot);
    }
    return privately(account.sessions(claims.playerId(), slot, pageQuery(page, size)));
  }

  @GetMapping("/history")
  ResponseEntity<PageResult<HistoryItemDto>> history(AccessClaims claims,
                                                     @RequestParam(defaultValue = "0") int page,
                                                     @RequestParam(defaultValue = "20") int size,
                                                     @RequestParam(required = false) String type) {
    if (type != null && !HISTORY_TYPES.contains(type)) {
      throw new InvalidParameterException("type", "Enum", "Must be one of " + HISTORY_TYPES + ".");
    }
    return privately(account.history(claims.playerId(), type, pageQuery(page, size)));
  }

  // ----------------------------------------------------------- achievements

  @GetMapping("/achievements")
  ResponseEntity<List<PlayerAchievementDto>> achievements(AccessClaims claims) {
    return privately(achievements.forPlayer(claims.playerId()));
  }

  @PutMapping("/achievements/{achievementId}")
  ResponseEntity<PlayerAchievementDto> unlock(AccessClaims claims, @PathVariable String achievementId,
                                              @Valid @RequestBody UnlockAchievementRequest request) {
    if (!achievementId.matches(ACHIEVEMENT_ID)) {
      throw new InvalidParameterException("achievementId", "Pattern", "Must match " + ACHIEVEMENT_ID + ".");
    }
    var result = achievements.unlock(claims.playerId(), achievementId, request.unlockedAt());
    return ResponseEntity.status(result.created() ? HttpStatus.CREATED : HttpStatus.OK)
        .cacheControl(CacheControl.noStore())
        .body(result.achievement());
  }

  private static PageQuery pageQuery(int page, int size) {
    if (page < 0) {
      throw new InvalidParameterException("page", "Min", "Must be 0 or greater.");
    }
    if (size < 1 || size > PageQuery.MAX_SIZE) {
      throw new InvalidParameterException("size", "Range", "Must be between 1 and " + PageQuery.MAX_SIZE + ".");
    }
    return new PageQuery(page, size);
  }

  static <T> ResponseEntity<T> privately(T body) {
    return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(body);
  }
}