package mx.utch.tdimp.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

// Documento completo de una ranura que produce y consume Unity; la API lo reparte en tablas.
public record SaveDataDto(
    @NotNull @Min(0) Integer version,
    @NotNull @Pattern(regexp = "TSUKI|HIKARI") String activeCharacter,
    @NotNull @Min(0) @Max(20) Integer currentChapter,
    @Size(max = 80) String currentScene,
    @Valid Position position,
    @Min(0) Integer health,
    @NotNull @Valid SaveStatsDto stats,
    @NotNull @Size(max = 200) List<@NotNull @Valid InventoryEntry> inventory,
    @NotNull @Size(max = 2000) List<@NotNull @Pattern(regexp = "^[A-Za-z0-9_.:-]{1,100}$") String> collectedPickups,
    @NotNull @Size(max = 2000) List<@NotNull @Valid ObjectState> objects,
    @NotNull @Size(max = 100) List<@NotNull @Valid CompletedMilestone> completedMilestones,
    @NotNull Map<String, Object> extraData) {

  public record Position(@NotNull Double x, @NotNull Double y) {
  }

  public record InventoryEntry(
      @NotNull @Pattern(regexp = "^[a-z0-9_]{2,40}$") String itemId,
      @NotNull @Min(1) @Max(999) Integer quantity) {
  }

  public record ObjectState(
      @NotNull @Pattern(regexp = "^[A-Za-z0-9_.:-]{1,100}$") String objectId,
      @NotNull @Pattern(regexp = "^[A-Z_]{2,30}$") String state) {
  }

  public record CompletedMilestone(
      @NotNull @Pattern(regexp = "^[a-z0-9_]{2,40}$") String milestoneId,
      @Min(0) Integer playTimeSec,
      @NotNull OffsetDateTime completedAt) {
  }
}
