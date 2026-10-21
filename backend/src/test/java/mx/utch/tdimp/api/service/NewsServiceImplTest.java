package mx.utch.tdimp.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import mx.utch.tdimp.api.dto.PageQuery;
import mx.utch.tdimp.api.exception.NotFoundException;
import mx.utch.tdimp.api.model.NewsPost;
import mx.utch.tdimp.api.repository.NewsReader;
import org.junit.jupiter.api.Test;

/** Unit test: the repository is a Mockito double, no database and no Spring context. */
class NewsServiceImplTest {

  private static final OffsetDateTime PUBLISHED = OffsetDateTime.of(2026, 10, 1, 18, 0, 0, 0, ZoneOffset.UTC);

  private final NewsReader reader = mock(NewsReader.class);
  private final NewsService service = new NewsServiceImpl(reader);

  @Test
  void listReturnsSummariesAndPageMetadata() {
    var post = new NewsPost("devlog-1", "Devlog 1", "Resumen", "# Texto", "cover_1", PUBLISHED);
    when(reader.findPublished(2, 2L)).thenReturn(List.of(post));
    when(reader.countPublished()).thenReturn(3L);

    var result = service.list(new PageQuery(1, 2));

    assertThat(result.content()).singleElement()
        .satisfies(s -> assertThat(s.slug()).isEqualTo("devlog-1"));
    assertThat(result.page().number()).isEqualTo(1);
    assertThat(result.page().totalElements()).isEqualTo(3);
    assertThat(result.page().totalPages()).isEqualTo(2);
  }

  @Test
  void getThrowsNotFoundWhenSlugDoesNotExist() {
    when(reader.findPublishedBySlug("missing")).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.get("missing")).isInstanceOf(NotFoundException.class);
  }
}