package mx.utch.tdimp.api.dto;

/** {@code Achievement} schema of the contract. description and iconKey are null while masked. */
public record AchievementDto(
    String id,
    String name,
    String description,
    String iconKey,
    boolean hidden,
    int sortOrder) {
}