package mx.utch.tdimp.api.controller;

import java.time.Duration;
import java.util.List;
import mx.utch.tdimp.api.dto.AchievementDto;
import mx.utch.tdimp.api.service.AchievementService;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/achievements")
class AchievementController {

  private static final CacheControl PUBLIC_1_HOUR = CacheControl.maxAge(Duration.ofHours(1)).cachePublic();

  private final AchievementService achievements;

  AchievementController(AchievementService achievements) {
    this.achievements = achievements;
  }

  @GetMapping
  ResponseEntity<List<AchievementDto>> list() {
    return ResponseEntity.ok().cacheControl(PUBLIC_1_HOUR).body(achievements.catalog());
  }
}
