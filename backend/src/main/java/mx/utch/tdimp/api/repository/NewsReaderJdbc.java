package mx.utch.tdimp.api.repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import mx.utch.tdimp.api.config.QueryTimer;
import mx.utch.tdimp.api.model.NewsPost;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
class NewsReaderJdbc implements NewsReader {

  private static final Logger log = LoggerFactory.getLogger(NewsReaderJdbc.class);

  private static final String COLUMNS = "slug, title, summary, content_md, cover_key, published_at";

  private final JdbcClient jdbc;

  NewsReaderJdbc(JdbcClient jdbc) {
    this.jdbc = jdbc;
  }

  @Override
  public List<NewsPost> findPublished(int limit, long offset) {
    var timed = QueryTimer.time(() -> jdbc.sql("""
            select %s
            from news_posts
            where published_at is not null
            order by published_at desc, slug
            limit :limit offset :offset
            """.formatted(COLUMNS))
        .param("limit", limit)
        .param("offset", offset)
        .query(NewsReaderJdbc::map)
        .list());
    log.debug("BD SELECT news_posts (limit={}, offset={}) -> {} filas en {} ms", limit, offset,
        timed.value().size(), String.format("%.1f", timed.millis()));
    return timed.value();
  }

  @Override
  public long countPublished() {
    var timed = QueryTimer.time(() -> jdbc.sql("select count(*) from news_posts where published_at is not null")
        .query(Long.class)
        .single());
    log.debug("BD SELECT count(news_posts) -> {} en {} ms", timed.value(), String.format("%.1f", timed.millis()));
    return timed.value();
  }

  @Override
  public Optional<NewsPost> findPublishedBySlug(String slug) {
    var timed = QueryTimer.time(() -> jdbc.sql("""
            select %s
            from news_posts
            where slug = :slug and published_at is not null
            """.formatted(COLUMNS))
        .param("slug", slug)
        .query(NewsReaderJdbc::map)
        .optional());
    log.debug("BD SELECT news_posts (slug={}) -> {} en {} ms", slug, timed.value().isPresent() ? "1 fila" : "0 filas",
        String.format("%.1f", timed.millis()));
    return timed.value();
  }

  private static NewsPost map(ResultSet rs, int rowNum) throws SQLException {
    return new NewsPost(
        rs.getString("slug"),
        rs.getString("title"),
        rs.getString("summary"),
        rs.getString("content_md"),
        rs.getString("cover_key"),
        rs.getObject("published_at", OffsetDateTime.class));
  }
}
