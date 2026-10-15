package mx.utch.tdimp.api.repository;

import java.util.List;
import java.util.Optional;
import mx.utch.tdimp.api.model.NewsPost;

public interface NewsReader {

  List<NewsPost> findPublished(int limit, long offset);

  long countPublished();

  Optional<NewsPost> findPublishedBySlug(String slug);
}
