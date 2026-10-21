package mx.utch.tdimp.api.repository;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import mx.utch.tdimp.api.dto.AchievementDto;

public interface CatalogReader {

  // Devuelven los ids que NO existen en el catálogo (vacío = todos válidos).
  Set<String> unknownItems(Collection<String> ids);

  Set<String> unknownMilestones(Collection<String> ids);

  List<AchievementDto> achievements();

  boolean achievementExists(String id);
}
