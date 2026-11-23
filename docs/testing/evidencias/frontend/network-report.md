# Tráfico /api de la PWA (2026-11-22T23:24:21.873Z)

Origen: http://localhost:4173 · Chromium 156.0.8078.4. "Desde SW" = respuesta entregada por el Service Worker a la página.

| Paso | Método | URL | Status | Desde SW | TTFB (ms) | Total (ms) | Respuesta (B) | Payload | Cache-Control | Server-Timing | X-Queued |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PWA-01 | POST | `/api/v1/auth/refresh` | 401 | no | 14 | 16 | 191 | {} | — | app;desc="Spring Boot";dur=9.4, db;desc="PostgreSQL";dur=0.0 | — |
| PWA-01 | GET | `/api/v1/achievements` | 200 | no | 35 | 36 | 850 | — | max-age=3600, public | app;desc="Spring Boot";dur=17.3, db;desc="PostgreSQL";dur=1.3 | — |
| PWA-01 | GET | `/api/v1/news?page=0&size=3` | 200 | no | 42 | 43 | 957 | — | max-age=300, public | app;desc="Spring Boot";dur=30.5, db;desc="PostgreSQL";dur=3.6 | — |
| PWA-01 | POST | `/api/v1/auth/refresh` | 401 | no | 6 | 9 | 191 | {} | — | app;desc="Spring Boot";dur=2.2, db;desc="PostgreSQL";dur=0.0 | — |
| PWA-01 | GET | `/api/v1/achievements` | 200 | sí | 3 | 4 | — | — | max-age=3600, public | app;desc="Spring Boot";dur=17.3, db;desc="PostgreSQL";dur=1.3 | — |
| PWA-01 | GET | `/api/v1/news?page=0&size=3` | 200 | sí | 3 | 5 | — | — | max-age=300, public | app;desc="Spring Boot";dur=30.5, db;desc="PostgreSQL";dur=3.6 | — |
| PWA-02 | POST | `/api/v1/auth/refresh` | 401 | no | 12 | 15 | 191 | {} | — | app;desc="Spring Boot";dur=7.5, db;desc="PostgreSQL";dur=0.0 | — |
| PWA-02 | GET | `/api/v1/news?page=0&size=6` | 200 | sí | 11 | 11 | — | — | max-age=300, public | app;desc="Spring Boot";dur=4.8, db;desc="PostgreSQL";dur=1.7 | — |
| PWA-02 | GET | `/api/v1/news?page=1&size=6` | 200 | sí | 11 | 12 | — | — | max-age=300, public | app;desc="Spring Boot";dur=5.4, db;desc="PostgreSQL";dur=2.0 | — |
| PWA-03 | GET | `/api/v1/news/ya-puedes-jugar-la-demo-del-capitulo-1` | 200 | sí | 10 | 11 | — | — | max-age=300, public | app;desc="Spring Boot";dur=3.6, db;desc="PostgreSQL";dur=1.0 | — |
| PWA-04 | POST | `/api/v1/auth/refresh` | 401 | no | 7 | 9 | 191 | {} | — | app;desc="Spring Boot";dur=3.1, db;desc="PostgreSQL";dur=0.0 | — |
| PWA-04 | GET | `/api/v1/achievements` | 200 | sí | 2 | 4 | — | — | max-age=3600, public | app;desc="Spring Boot";dur=17.3, db;desc="PostgreSQL";dur=1.3 | — |
| PWA-04 | GET | `/api/v1/news?page=0&size=3` | 200 | sí | 2 | 4 | — | — | max-age=300, public | app;desc="Spring Boot";dur=30.5, db;desc="PostgreSQL";dur=3.6 | — |
| PWA-04 | POST | `/api/v1/subscriptions` | 202 | sí | 16 | 16 | — | {"email":"lab-online-20261122232421@tdimp.test","language":"es","consent":true} | — | app;desc="Spring Boot";dur=3.5, db;desc="PostgreSQL";dur=0.8 | — |
| PWA-05 | POST | `/api/v1/auth/refresh` | falló: net::ERR_INTERNET_DISCONNECTED | no | — | — | — | — | — | — | — |
| PWA-05 | GET | `/api/v1/news?page=0&size=6` | 200 | sí | 4 | 5 | — | — | max-age=300, public | app;desc="Spring Boot";dur=4.8, db;desc="PostgreSQL";dur=1.7 | — |
| PWA-05 | POST | `/api/v1/auth/refresh` | falló: net::ERR_INTERNET_DISCONNECTED | no | — | — | — | — | — | — | — |
| PWA-05 | GET | `/api/v1/news/ya-puedes-jugar-la-demo-del-capitulo-1` | 200 | sí | 2 | 3 | — | — | max-age=300, public | app;desc="Spring Boot";dur=3.6, db;desc="PostgreSQL";dur=1.0 | — |
| PWA-06 | POST | `/api/v1/auth/refresh` | falló: net::ERR_INTERNET_DISCONNECTED | no | — | — | — | — | — | — | — |
| PWA-06 | GET | `/api/v1/news/anunciamos-the-day-i-made-that-promise` | falló: net::ERR_FAILED | no | — | — | — | — | — | — | — |
| PWA-06 | GET | `/api/v1/news/anunciamos-the-day-i-made-that-promise` | falló: net::ERR_FAILED | no | — | — | — | — | — | — | — |
| PWA-07 | POST | `/api/v1/auth/refresh` | falló: net::ERR_INTERNET_DISCONNECTED | no | — | — | — | — | — | — | — |
| PWA-07 | GET | `/api/v1/achievements` | 200 | sí | 2 | 3 | — | — | max-age=3600, public | app;desc="Spring Boot";dur=17.3, db;desc="PostgreSQL";dur=1.3 | — |
| PWA-07 | GET | `/api/v1/news?page=0&size=3` | 200 | sí | 2 | 3 | — | — | max-age=300, public | app;desc="Spring Boot";dur=30.5, db;desc="PostgreSQL";dur=3.6 | — |
| PWA-07 | POST | `/api/v1/subscriptions` | 202 | sí | 26 | 27 | — | {"email":"lab-offline-20261122232421@tdimp.test","language":"es","consent":true} | — | — | 1 |
| PWA-09 | POST | `/api/v1/auth/refresh` | 401 | no | 11 | 14 | 191 | {} | — | app;desc="Spring Boot";dur=6.2, db;desc="PostgreSQL";dur=0.0 | — |
| PWA-09 | POST | `/api/v1/auth/register` | 201 | no | 85 | 91 | 487 | {"email":"lab-user-web-20261122232421@tdimp.test","username":"lab_web_22232421","password":"***","acceptedPrivacyNotice":true,"client":"WEB"} | no-store | app;desc="Spring Boot";dur=81.9, db;desc="PostgreSQL";dur=4.3 | — |
| PWA-09 | GET | `/api/v1/account/saves` | 200 | no | 27 | 29 | 2 | — | no-store | app;desc="Spring Boot";dur=20.5, db;desc="PostgreSQL";dur=7.4 | — |
| PWA-09 | GET | `/api/v1/account` | 200 | no | 32 | 35 | 328 | — | no-store | app;desc="Spring Boot";dur=26.6, db;desc="PostgreSQL";dur=23.1 | — |
| PWA-09 | GET | `/api/v1/account/history?page=0&size=5` | 200 | no | 39 | 42 | 76 | — | no-store | app;desc="Spring Boot";dur=33.2, db;desc="PostgreSQL";dur=23.1 | — |
| PWA-09 | POST | `/api/v1/auth/refresh` | 200 | no | 30 | 32 | 487 | {} | no-store | app;desc="Spring Boot";dur=23.6, db;desc="PostgreSQL";dur=13.8 | — |
