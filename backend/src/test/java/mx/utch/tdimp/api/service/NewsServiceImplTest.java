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

  @Test
  void getReturnsTheWholePostWithItsMarkdown() {
    var post = new NewsPost("devlog-1", "Devlog 1", "Resumen", "# Texto", "cover_1", PUBLISHED);
    when(reader.findPublishedBySlug("devlog-1")).thenReturn(Optional.of(post));

    var dto = service.get("devlog-1");

    assertThat(dto.slug()).isEqualTo("devlog-1");
    assertThat(dto.title()).isEqualTo("Devlog 1");
    assertThat(dto.summary()).isEqualTo("Resumen");
    assertThat(dto.coverKey()).isEqualTo("cover_1");
    assertThat(dto.publishedAt()).isEqualTo(PUBLISHED);
    assertThat(dto.contentMd()).isEqualTo("# Texto");
  }

  @Test
  void anEmptyListHasNoPages() {
    when(reader.findPublished(20, 0L)).thenReturn(List.of());
    when(reader.countPublished()).thenReturn(0L);

    var result = service.list(new PageQuery(0, 20));

    assertThat(result.content()).isEmpty();
    assertThat(result.page().totalElements()).isZero();
    assertThat(result.page().totalPages()).isZero();
  }
}