package mx.utch.tdimp.api.controller;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Duration;
import mx.utch.tdimp.api.dto.NewsPostDto;
import mx.utch.tdimp.api.dto.NewsSummaryDto;
import mx.utch.tdimp.api.dto.PageQuery;
import mx.utch.tdimp.api.dto.PageResult;
import mx.utch.tdimp.api.service.NewsService;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/news")
class NewsController {

  /** Same pattern as the contract: lowercase words joined by hyphens. */
  private static final String SLUG = "^[a-z0-9]+(-[a-z0-9]+)*$";
  private static final CacheControl PUBLIC_5_MIN = CacheControl.maxAge(Duration.ofMinutes(5)).cachePublic();

  private final NewsService news;

  NewsController(NewsService news) {
    this.news = news;
  }

  @GetMapping
  ResponseEntity<PageResult<NewsSummaryDto>> list(
      @RequestParam(defaultValue = "0") @Min(0) int page,
      @RequestParam(defaultValue = "20") @Min(1) @Max(PageQuery.MAX_SIZE) int size) {
    return ResponseEntity.ok().cacheControl(PUBLIC_5_MIN).body(news.list(new PageQuery(page, size)));
  }

  @GetMapping("/{slug}")
  ResponseEntity<NewsPostDto> get(@PathVariable @Size(max = 80) @Pattern(regexp = SLUG) String slug) {
    return ResponseEntity.ok().cacheControl(PUBLIC_5_MIN).body(news.get(slug));
  }
}