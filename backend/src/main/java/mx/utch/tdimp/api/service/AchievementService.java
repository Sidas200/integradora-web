package mx.utch.tdimp.api.service;

import java.util.List;
import mx.utch.tdimp.api.dto.AchievementDto;

public interface AchievementService {

  /** Public catalog: hidden achievements always come masked. */
  List<AchievementDto> catalog();
}