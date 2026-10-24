package mx.utch.tdimp.api.repository;

import java.util.List;
import mx.utch.tdimp.api.model.Achievement;

public interface AchievementReader {

  /** Whole catalog ordered as the game shows it (sort_order, then id). */
  List<Achievement> findAllOrdered();
}