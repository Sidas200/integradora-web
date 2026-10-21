package mx.utch.tdimp.api.controller;

import mx.utch.tdimp.api.model.AccessClaims;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

// Un parámetro AccessClaims en un controlador recibe los claims del token: el id del jugador sale SIEMPRE de ahí.
@Component
class CurrentPlayerResolver implements HandlerMethodArgumentResolver {

  @Override
  public boolean supportsParameter(MethodParameter parameter) {
    return parameter.getParameterType() == AccessClaims.class;
  }

  @Override
  public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
    Object claims = webRequest.getAttribute(BearerAuthInterceptor.CLAIMS_ATTRIBUTE, RequestAttributes.SCOPE_REQUEST);
    if (claims == null) {
      throw new IllegalStateException("AccessClaims requested outside /api/v1/account/**");
    }
    return claims;
  }
}
