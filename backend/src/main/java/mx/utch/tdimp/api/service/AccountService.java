package mx.utch.tdimp.api.service;

import java.util.UUID;
import mx.utch.tdimp.api.dto.AccountDto;
import mx.utch.tdimp.api.dto.HistoryItemDto;
import mx.utch.tdimp.api.dto.PageQuery;
import mx.utch.tdimp.api.dto.PageResult;
import mx.utch.tdimp.api.dto.PlaySessionDto;
import mx.utch.tdimp.api.dto.SettingsDto;

public interface AccountService {

  AccountDto account(UUID playerId);

  SettingsDto settings(UUID playerId);

  SettingsDto replaceSettings(UUID playerId, SettingsDto settings);

  PageResult<PlaySessionDto> sessions(UUID playerId, Integer slot, PageQuery page);

  PageResult<HistoryItemDto> history(UUID playerId, String type, PageQuery page);
}
