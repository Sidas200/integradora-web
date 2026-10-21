package mx.utch.tdimp.api.service;

import java.util.List;
import mx.utch.tdimp.api.dto.AchievementDto;
import mx.utch.tdimp.api.model.Achievement;
import mx.utch.tdimp.api.repository.AchievementReader;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class AchievementServiceImpl implements AchievementService {

  private final AchievementReader reader;

  AchievementServiceImpl(AchievementReader reader) {
    this.reader = reader;
  }

  @Override
  @Transactional(readOnly = true)
  public List<AchievementDto> catalog() {
    return reader.findAllOrdered().stream()
        .map(a -> a.maskedUnless(false))
        .map(AchievementServiceImpl::toDto)
        .toList();
  }

  private static AchievementDto toDto(Achievement a) {
    return new AchievementDto(a.id(), a.name(), a.description(), a.iconKey(), a.hidden(), a.sortOrder());
  }
}