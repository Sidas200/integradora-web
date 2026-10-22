package mx.utch.tdimp.api.repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import mx.utch.tdimp.api.config.QueryTimer;
import mx.utch.tdimp.api.model.Achievement;
import mx.utch.tdimp.api.model.PlayerAchievement;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
class AchievementRepositoryJdbc implements AchievementRepository {

  private final JdbcClient jdbc;

  AchievementRepositoryJdbc(JdbcClient jdbc) {
    this.jdbc = jdbc;
  }

  @Override
  public List<PlayerAchievement> forPlayer(UUID playerId) {
    return QueryTimer.time(() -> jdbc.sql("""
            select a.id, a.name, a.description, a.icon_key, a.hidden, a.sort_order, pa.unlocked_at
            from achievements a
            left join player_achievements pa on pa.achievement_id = a.id and pa.player_id = :playerId
            order by a.sort_order, a.id
            """)
        .param("playerId", playerId)
        .query((rs, n) -> new PlayerAchievement(
            new Achievement(rs.getString("id"), rs.getString("name"), rs.getString("description"),
                rs.getString("icon_key"), rs.getBoolean("hidden"), rs.getInt("sort_order")),
            rs.getObject("unlocked_at", OffsetDateTime.class)))
        .list()).value();
  }

  @Override
  public boolean unlock(UUID playerId, String achievementId, OffsetDateTime unlockedAt) {
    return QueryTimer.time(() -> jdbc.sql("""
            insert into player_achievements (player_id, achievement_id, unlocked_at)
            values (:playerId, :achievementId, :unlockedAt)
            on conflict do nothing
            """)
        .param("playerId", playerId)
        .param("achievementId", achievementId)
        .param("unlockedAt", unlockedAt)
        .update()).value() == 1;
  }
}
