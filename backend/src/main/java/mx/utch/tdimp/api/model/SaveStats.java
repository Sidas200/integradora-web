package mx.utch.tdimp.api.model;

/** Counters of one save slot (save_stats table). */
public record SaveStats(int playTimeSec, int enemiesDefeated, int deaths, int materialsCollected, int itemsCrafted) {

  public static final SaveStats EMPTY = new SaveStats(0, 0, 0, 0, 0);
}
