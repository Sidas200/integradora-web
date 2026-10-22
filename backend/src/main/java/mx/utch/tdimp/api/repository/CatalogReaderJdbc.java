package mx.utch.tdimp.api.repository;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import mx.utch.tdimp.api.config.QueryTimer;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
class CatalogReaderJdbc implements CatalogReader {

  private final JdbcClient jdbc;

  CatalogReaderJdbc(JdbcClient jdbc) {
    this.jdbc = jdbc;
  }

  @Override
  public Set<String> unknownItems(Collection<String> ids) {
    return unknown("items", ids);
  }

  @Override
  public Set<String> unknownMilestones(Collection<String> ids) {
    return unknown("story_milestones", ids);
  }

  private Set<String> unknown(String table, Collection<String> ids) {
    if (ids.isEmpty()) {
      return Set.of();
    }
    var known = QueryTimer.time(() -> jdbc.sql("select id from " + table + " where id in (:ids)")
        .param("ids", Set.copyOf(ids))
        .query(String.class)
        .list()).value();
    var missing = new HashSet<>(ids);
    known.forEach(missing::remove);
    return missing;
  }

  @Override
  public boolean achievementExists(String id) {
    return QueryTimer.time(() -> jdbc.sql("select exists (select 1 from achievements where id = :id)")
        .param("id", id)
        .query(Boolean.class)
        .single()).value();
  }
}
