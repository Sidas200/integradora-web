# syntax=docker/dockerfile:1

# ---------- Stage 1: build the PWA ----------
  FROM node:24-slim AS build
  WORKDIR /app
  
  # Manifests first: if they do not change, Docker reuses the npm ci layer
  COPY package.json package-lock.json ./
  RUN npm ci
  
  # Source code and production build (dist/ with sw.js and the manifest)
  COPY . .
  RUN npm run build
  
  # ---------- Stage 2: serve static files ----------
  FROM nginxinc/nginx-unprivileged:stable-alpine
  LABEL org.opencontainers.image.title="tdimp-web" \
        org.opencontainers.image.description="The Day I Made That Promise PWA served by nginx"
  
  # Where nginx forwards /api (same role as API_ORIGIN in Vercel)
  ENV API_ORIGIN=http://api:8080
  
  # The image renders /etc/nginx/templates/*.template into conf.d on startup
  COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
  COPY --from=build /app/dist /usr/share/nginx/html
  
  EXPOSE 8080
  HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD wget -q --spider http://127.0.0.1:8080/ || exit 1