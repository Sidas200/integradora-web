package mx.utch.tdimp.api.repository;

import java.util.Collection;
import java.util.Set;

public interface CatalogReader {

  // Devuelven los ids que NO existen en el catálogo (vacío = todos válidos).
  Set<String> unknownItems(Collection<String> ids);

  Set<String> unknownMilestones(Collection<String> ids);

  boolean achievementExists(String id);
}
