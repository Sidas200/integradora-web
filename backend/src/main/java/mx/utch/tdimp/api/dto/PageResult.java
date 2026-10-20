package mx.utch.tdimp.api.dto;

import java.util.List;

public record PageResult<T>(List<T> content, PageMeta page) {

  public static <T> PageResult<T> of(List<T> content, PageQuery query, long totalElements) {
    int totalPages = (int) ((totalElements + query.size() - 1) / query.size());
    return new PageResult<>(content, new PageMeta(query.page(), query.size(), totalElements, totalPages));
  }
}
