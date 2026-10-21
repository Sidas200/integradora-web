package mx.utch.tdimp.api.dto;

public record AchievementDto(String id, String name, String description, String iconKey, boolean hidden,
                             int sortOrder) {
}
