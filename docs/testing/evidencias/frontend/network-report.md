# Tráfico /api de la PWA (2026-10-21T20:45:31.152Z)

Origen: http://localhost:4173 · Chromium 156.0.8078.4. "Desde SW" = respuesta entregada por el Service Worker a la página.

| Paso | Método | URL | Status | Desde SW | TTFB (ms) | Total (ms) | Respuesta (B) | Payload | Cache-Control | Server-Timing | X-Queued |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PWA-01 | GET | `/api/v1/achievements` | 200 | no | 18 | 19 | 850 | — | max-age=3600, public | app;desc="Spring Boot";dur=6.3, db;desc="PostgreSQL";dur=1.5 | — |
| PWA-01 | GET | `/api/v1/news?page=0&size=3` | 200 | no | 23 | 25 | 784 | — | max-age=300, public | app;desc="Spring Boot";dur=14.1, db;desc="PostgreSQL";dur=10.6 | — |
| PWA-01 | GET | `/api/v1/achievements` | 200 | sí | 2 | 4 | — | — | max-age=3600, public | app;desc="Spring Boot";dur=6.3, db;desc="PostgreSQL";dur=1.5 | — |
| PWA-01 | GET | `/api/v1/news?page=0&size=3` | 200 | sí | 2 | 4 | — | — | max-age=300, public | app;desc="Spring Boot";dur=14.1, db;desc="PostgreSQL";dur=10.6 | — |
| PWA-02 | GET | `/api/v1/news?page=0&size=6` | 200 | sí | 11 | 12 | — | — | max-age=300, public | app;desc="Spring Boot";dur=5.1, db;desc="PostgreSQL";dur=2.0 | — |
| PWA-02 | GET | `/api/v1/news?page=1&size=6` | 200 | sí | 13 | 13 | — | — | max-age=300, public | app;desc="Spring Boot";dur=6.4, db;desc="PostgreSQL";dur=2.6 | — |
| PWA-03 | GET | `/api/v1/news/announcing-the-day-i-made-that-promise` | 200 | sí | 10 | 11 | — | — | max-age=300, public | app;desc="Spring Boot";dur=3.5, db;desc="PostgreSQL";dur=0.9 | — |
| PWA-04 | GET | `/api/v1/achievements` | 200 | sí | 2 | 4 | — | — | max-age=3600, public | app;desc="Spring Boot";dur=6.3, db;desc="PostgreSQL";dur=1.5 | — |
| PWA-04 | GET | `/api/v1/news?page=0&size=3` | 200 | sí | 2 | 5 | — | — | max-age=300, public | app;desc="Spring Boot";dur=14.1, db;desc="PostgreSQL";dur=10.6 | — |
| PWA-04 | POST | `/api/v1/subscriptions` | 202 | sí | 20 | 22 | — | {"email":"lab-online-20261021204531@tdimp.test","language":"es","consent":true} | — | app;desc="Spring Boot";dur=7.2, db;desc="PostgreSQL";dur=1.8 | — |
| PWA-05 | GET | `/api/v1/news?page=0&size=6` | 200 | sí | 2 | 2 | — | — | max-age=300, public | app;desc="Spring Boot";dur=5.1, db;desc="PostgreSQL";dur=2.0 | — |
| PWA-05 | GET | `/api/v1/news/announcing-the-day-i-made-that-promise` | 200 | sí | 2 | 3 | — | — | max-age=300, public | app;desc="Spring Boot";dur=3.5, db;desc="PostgreSQL";dur=0.9 | — |
| PWA-06 | GET | `/api/v1/news/lab-devlog-02-tsuki-controls` | falló: net::ERR_FAILED | no | — | — | — | — | — | — | — |
| PWA-06 | GET | `/api/v1/news/lab-devlog-02-tsuki-controls` | falló: net::ERR_FAILED | no | — | — | — | — | — | — | — |
| PWA-07 | GET | `/api/v1/achievements` | 200 | sí | 2 | 4 | — | — | max-age=3600, public | app;desc="Spring Boot";dur=6.3, db;desc="PostgreSQL";dur=1.5 | — |
| PWA-07 | GET | `/api/v1/news?page=0&size=3` | 200 | sí | 3 | 4 | — | — | max-age=300, public | app;desc="Spring Boot";dur=14.1, db;desc="PostgreSQL";dur=10.6 | — |
| PWA-07 | POST | `/api/v1/subscriptions` | 202 | sí | 46 | 47 | — | {"email":"lab-offline-20261021204531@tdimp.test","language":"es","consent":true} | — | — | 1 |
