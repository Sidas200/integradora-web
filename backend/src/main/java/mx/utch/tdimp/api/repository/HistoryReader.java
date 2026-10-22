package mx.utch.tdimp.api.repository;

import java.util.List;
import java.util.UUID;
import mx.utch.tdimp.api.model.AccountSummary;
import mx.utch.tdimp.api.model.HistoryItem;
import mx.utch.tdimp.api.model.PlaySession;

public interface HistoryReader {

  AccountSummary summary(UUID playerId);

  List<PlaySession> sessions(UUID playerId, Integer slot, int limit, long offset);

  long countSessions(UUID playerId, Integer slot);

  List<HistoryItem> history(UUID playerId, String type, int limit, long offset);

  long countHistory(UUID playerId, String type);
}
