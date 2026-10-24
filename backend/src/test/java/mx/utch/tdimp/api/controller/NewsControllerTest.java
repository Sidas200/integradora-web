package mx.utch.tdimp.api.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import mx.utch.tdimp.api.dto.PageQuery;
import mx.utch.tdimp.api.dto.PageResult;
import mx.utch.tdimp.api.exception.NotFoundException;
import mx.utch.tdimp.api.service.NewsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/** Presentation layer only: HTTP, validation and errors. The service is a double. */
@WebMvcTest(NewsController.class)
class NewsControllerTest {

  @Autowired
  MockMvc mvc;

  @MockitoBean
  NewsService news;

  @Test
  void listReturnsPageWithPublicCache() throws Exception {
    when(news.list(new PageQuery(0, 20))).thenReturn(PageResult.of(List.of(), new PageQuery(0, 20), 0));

    mvc.perform(get("/api/v1/news"))
        .andExpect(status().isOk())
        .andExpect(header().string("Cache-Control", "max-age=300, public"))
        .andExpect(jsonPath("$.page.totalElements").value(0));
  }

  @Test
  void sizeAboveMaximumIsValidationProblem() throws Exception {
    mvc.perform(get("/api/v1/news").param("size", "51"))
        .andExpect(status().isBadRequest())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
        .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
        .andExpect(jsonPath("$.errors[0].field").value("size"))
        .andExpect(jsonPath("$.errors[0].code").value("Max"));
  }

  @Test
  void slugOutsideTheContractPatternIsValidationProblem() throws Exception {
    mvc.perform(get("/api/v1/news/Not_A_Slug"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
        .andExpect(jsonPath("$.errors[0].field").value("slug"))
        .andExpect(jsonPath("$.errors[0].code").value("Pattern"));
  }

  @Test
  void unknownSlugIsNotFoundProblem() throws Exception {
    when(news.get("missing")).thenThrow(new NotFoundException("News post not found: missing"));

    mvc.perform(get("/api/v1/news/missing"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("NOT_FOUND"))
        .andExpect(jsonPath("$.type").value("https://tdimp.app/problems/not-found"));
  }
}