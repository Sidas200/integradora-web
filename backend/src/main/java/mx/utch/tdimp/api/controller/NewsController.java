package mx.utch.tdimp.api.controller;

import java.time.Duration;
import mx.utch.tdimp.api.dto.NewsPostDto;
import mx.utch.tdimp.api.dto.NewsSummaryDto;
import mx.utch.tdimp.api.dto.PageQuery;
import mx.utch.tdimp.api.dto.PageResult;
import mx.utch.tdimp.api.exception.InvalidParameterException;
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

  private static final CacheControl PUBLIC_5_MIN = CacheControl.maxAge(Duration.ofMinutes(5)).cachePublic();

  private final NewsService news;

  NewsController(NewsService news) {
    this.news = news;
  }

  @GetMapping
  ResponseEntity<PageResult<NewsSummaryDto>> list(@RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "20") int size) {
    if (page < 0) {
      throw new InvalidParameterException("page", "Min", "Must be 0 or greater.");
    }
    if (size < 1 || size > PageQuery.MAX_SIZE) {
      throw new InvalidParameterException("size", "Range", "Must be between 1 and " + PageQuery.MAX_SIZE + ".");
    }
    return ResponseEntity.ok().cacheControl(PUBLIC_5_MIN).body(news.list(new PageQuery(page, size)));
  }

  @GetMapping("/{slug}")
  ResponseEntity<NewsPostDto> get(@PathVariable String slug) {
    return ResponseEntity.ok().cacheControl(PUBLIC_5_MIN).body(news.get(slug));
  }
}
