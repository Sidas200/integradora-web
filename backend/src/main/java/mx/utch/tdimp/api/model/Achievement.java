package mx.utch.tdimp.api.model;

/**
 * Catalog entry of the {@code achievements} table. The id is the contract with Unity
 * (same id as the achievement in the game).
 */
public record Achievement(
    String id,
    String name,
    String description,
    String iconKey,
    boolean hidden,
    int sortOrder) {

  /** Name shown instead of the real one while a hidden achievement is locked. */
  public static final String MASKED_NAME = "Logro oculto";

  /**
   * Business rule: a hidden achievement does not reveal its name, description or icon
   * until the player unlocks it. The public catalog never has a player, so it is always masked.
   */
  public Achievement maskedUnless(boolean unlocked) {
    if (!hidden || unlocked) {
      return this;
    }
    return new Achievement(id, MASKED_NAME, null, null, true, sortOrder);
  }
}