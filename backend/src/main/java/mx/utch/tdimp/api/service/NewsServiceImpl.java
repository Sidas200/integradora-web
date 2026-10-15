package mx.utch.tdimp.api.service;

import mx.utch.tdimp.api.dto.NewsPostDto;
import mx.utch.tdimp.api.dto.NewsSummaryDto;
import mx.utch.tdimp.api.dto.PageQuery;
import mx.utch.tdimp.api.dto.PageResult;
import mx.utch.tdimp.api.exception.NotFoundException;
import mx.utch.tdimp.api.model.NewsPost;
import mx.utch.tdimp.api.repository.NewsReader;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class NewsServiceImpl implements NewsService {

  private final NewsReader reader;

  NewsServiceImpl(NewsReader reader) {
    this.reader = reader;
  }

  @Override
  @Transactional(readOnly = true)
  public PageResult<NewsSummaryDto> list(PageQuery page) {
    var content = reader.findPublished(page.size(), page.offset()).stream()
        .map(NewsServiceImpl::toSummary)
        .toList();
    return PageResult.of(content, page, reader.countPublished());
  }

  @Override
  @Transactional(readOnly = true)
  public NewsPostDto get(String slug) {
    return reader.findPublishedBySlug(slug)
        .map(p -> new NewsPostDto(p.slug(), p.title(), p.summary(), p.coverKey(), p.publishedAt(), p.contentMd()))
        .orElseThrow(() -> new NotFoundException("News post not found: " + slug));
  }

  private static NewsSummaryDto toSummary(NewsPost p) {
    return new NewsSummaryDto(p.slug(), p.title(), p.summary(), p.coverKey(), p.publishedAt());
  }
}
