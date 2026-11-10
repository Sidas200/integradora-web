package mx.utch.tdimp.api.dto;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/** Unit tests of the pagination math shared by every paged list of the API. */
class PageResultTest {

  @ParameterizedTest(name = "{0} elements in pages of {1} -> {2} pages")
  @CsvSource({
      "0, 20, 0",
      "1, 20, 1",
      "20, 20, 1",
      "21, 20, 2",
      "40, 20, 2",
      "41, 20, 3",
      "7, 1, 7",
      "100, 50, 2"
  })
  void totalPagesRoundsUp(long totalElements, int size, int expectedPages) {
    PageResult<String> result = PageResult.of(List.of(), new PageQuery(0, size), totalElements);

    assertThat(result.page().totalPages()).isEqualTo(expectedPages);
    assertThat(result.page().totalElements()).isEqualTo(totalElements);
    assertThat(result.page().size()).isEqualTo(size);
  }

  @ParameterizedTest(name = "page {0} of size {1} starts at {2}")
  @CsvSource({
      "0, 20, 0",
      "1, 20, 20",
      "3, 10, 30",
      "2, 50, 100"
  })
  void offsetIsPageTimesSize(int page, int size, long expectedOffset) {
    assertThat(new PageQuery(page, size).offset()).isEqualTo(expectedOffset);
  }

  @ParameterizedTest(name = "page {0}")
  @CsvSource({"0", "4"})
  void thePageNumberAndTheContentAreKept(int page) {
    PageResult<String> result = PageResult.of(List.of("a", "b"), new PageQuery(page, 2), 10);

    assertThat(result.page().number()).isEqualTo(page);
    assertThat(result.content()).containsExactly("a", "b");
  }
}