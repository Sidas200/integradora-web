package mx.utch.tdimp.api.controller;

import java.util.List;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
class WebConfig implements WebMvcConfigurer {

  private final BearerAuthInterceptor bearerAuth;
  private final CurrentPlayerResolver currentPlayer;

  WebConfig(BearerAuthInterceptor bearerAuth, CurrentPlayerResolver currentPlayer) {
    this.bearerAuth = bearerAuth;
    this.currentPlayer = currentPlayer;
  }

  @Override
  public void addInterceptors(InterceptorRegistry registry) {
    registry.addInterceptor(bearerAuth).addPathPatterns("/api/v1/account", "/api/v1/account/**");
  }

  @Override
  public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
    resolvers.add(currentPlayer);
  }
}
