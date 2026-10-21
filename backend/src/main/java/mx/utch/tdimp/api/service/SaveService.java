package mx.utch.tdimp.api.service;

import java.util.List;
import java.util.UUID;
import mx.utch.tdimp.api.dto.BatchResultDto;
import mx.utch.tdimp.api.dto.EventInput;
import mx.utch.tdimp.api.dto.PlaySessionInput;
import mx.utch.tdimp.api.dto.SaveAcceptedDto;
import mx.utch.tdimp.api.dto.SaveDataDto;
import mx.utch.tdimp.api.dto.SaveDetailDto;
import mx.utch.tdimp.api.dto.SaveSummaryDto;

public interface SaveService {

  List<SaveSummaryDto> list(UUID playerId);

  SaveDetailDto detail(UUID playerId, int slot);

  SaveDataDto download(UUID playerId, int slot);

  SaveAcceptedDto upload(UUID playerId, int slot, SaveDataDto data);

  BatchResultDto uploadSessions(UUID playerId, int slot, List<PlaySessionInput> sessions);

  BatchResultDto uploadEvents(UUID playerId, int slot, List<EventInput> events);
}
