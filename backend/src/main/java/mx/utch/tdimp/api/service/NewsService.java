package mx.utch.tdimp.api.service;

import mx.utch.tdimp.api.dto.NewsPostDto;
import mx.utch.tdimp.api.dto.NewsSummaryDto;
import mx.utch.tdimp.api.dto.PageQuery;
import mx.utch.tdimp.api.dto.PageResult;

public interface NewsService {

  PageResult<NewsSummaryDto> list(PageQuery page);

  NewsPostDto get(String slug);
}
