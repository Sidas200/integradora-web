package mx.utch.tdimp.api.repository;

import java.util.List;
import java.util.UUID;
import mx.utch.tdimp.api.dto.AccountSummaryDto;
import mx.utch.tdimp.api.dto.HistoryItemDto;
import mx.utch.tdimp.api.dto.PlaySessionDto;

public interface HistoryReader {

  AccountSummaryDto summary(UUID playerId);

  List<PlaySessionDto> sessions(UUID playerId, Integer slot, int limit, long offset);

  long countSessions(UUID playerId, Integer slot);

  List<HistoryItemDto> history(UUID playerId, String type, int limit, long offset);

  long countHistory(UUID playerId, String type);
}
