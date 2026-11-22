# Tráfico /api de la PWA (2026-11-22T21:52:54.978Z)

Origen: http://localhost:4173 · Chromium 156.0.8078.4. "Desde SW" = respuesta entregada por el Service Worker a la página.

| Paso | Método | URL | Status | Desde SW | TTFB (ms) | Total (ms) | Respuesta (B) | Payload | Cache-Control | Server-Timing | X-Queued |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PWA-01 | POST | `/api/v1/auth/refresh` | 401 | no | 39 | 41 | 191 | {} | — | app;desc="Spring Boot";dur=6.0, db;desc="PostgreSQL";dur=0.0 | — |
| PWA-01 | GET | `/api/v1/achievements` | 200 | no | 15 | 18 | 850 | — | max-age=3600, public | app;desc="Spring Boot";dur=7.5, db;desc="PostgreSQL";dur=1.4 | — |
| PWA-01 | GET | `/api/v1/news?page=0&size=3` | 200 | no | 29 | 32 | 957 | — | max-age=300, public | app;desc="Spring Boot";dur=21.1, db;desc="PostgreSQL";dur=14.8 | — |
| PWA-01 | POST | `/api/v1/auth/refresh` | 401 | no | 9 | 13 | 191 | {} | — | app;desc="Spring Boot";dur=3.5, db;desc="PostgreSQL";dur=0.0 | — |
| PWA-01 | GET | `/api/v1/achievements` | 200 | sí | 4 | 5 | — | — | max-age=3600, public | app;desc="Spring Boot";dur=7.5, db;desc="PostgreSQL";dur=1.4 | — |
| PWA-01 | GET | `/api/v1/news?page=0&size=3` | 200 | sí | 4 | 6 | — | — | max-age=300, public | app;desc="Spring Boot";dur=21.1, db;desc="PostgreSQL";dur=14.8 | — |
| PWA-02 | POST | `/api/v1/auth/refresh` | 401 | no | 9 | 11 | 191 | {} | — | app;desc="Spring Boot";dur=3.1, db;desc="PostgreSQL";dur=0.0 | — |
| PWA-02 | GET | `/api/v1/news?page=0&size=6` | 200 | sí | 16 | 17 | — | — | max-age=300, public | app;desc="Spring Boot";dur=7.6, db;desc="PostgreSQL";dur=2.7 | — |
| PWA-02 | GET | `/api/v1/news?page=1&size=6` | 200 | sí | 26 | 27 | — | — | max-age=300, public | app;desc="Spring Boot";dur=11.7, db;desc="PostgreSQL";dur=4.1 | — |
| PWA-03 | GET | `/api/v1/news/ya-puedes-jugar-la-demo-del-capitulo-1` | 200 | sí | 13 | 14 | — | — | max-age=300, public | app;desc="Spring Boot";dur=4.8, db;desc="PostgreSQL";dur=1.2 | — |
| PWA-04 | POST | `/api/v1/auth/refresh` | 401 | no | 11 | 14 | 191 | {} | — | app;desc="Spring Boot";dur=5.1, db;desc="PostgreSQL";dur=0.0 | — |
| PWA-04 | GET | `/api/v1/achievements` | 200 | sí | 2 | 4 | — | — | max-age=3600, public | app;desc="Spring Boot";dur=7.5, db;desc="PostgreSQL";dur=1.4 | — |
| PWA-04 | GET | `/api/v1/news?page=0&size=3` | 200 | sí | 2 | 4 | — | — | max-age=300, public | app;desc="Spring Boot";dur=21.1, db;desc="PostgreSQL";dur=14.8 | — |
| PWA-04 | POST | `/api/v1/subscriptions` | 202 | sí | 16 | 17 | — | {"email":"lab-online-20261122215254@tdimp.test","language":"es","consent":true} | — | app;desc="Spring Boot";dur=5.0, db;desc="PostgreSQL";dur=1.2 | — |
| PWA-05 | POST | `/api/v1/auth/refresh` | falló: net::ERR_INTERNET_DISCONNECTED | no | — | — | — | — | — | — | — |
| PWA-05 | GET | `/api/v1/news?page=0&size=6` | 200 | sí | 19 | 20 | — | — | max-age=300, public | app;desc="Spring Boot";dur=7.6, db;desc="PostgreSQL";dur=2.7 | — |
| PWA-05 | POST | `/api/v1/auth/refresh` | falló: net::ERR_INTERNET_DISCONNECTED | no | — | — | — | — | — | — | — |
| PWA-05 | GET | `/api/v1/news/ya-puedes-jugar-la-demo-del-capitulo-1` | 200 | sí | 2 | 3 | — | — | max-age=300, public | app;desc="Spring Boot";dur=4.8, db;desc="PostgreSQL";dur=1.2 | — |
| PWA-06 | POST | `/api/v1/auth/refresh` | falló: net::ERR_INTERNET_DISCONNECTED | no | — | — | — | — | — | — | — |
| PWA-06 | GET | `/api/v1/news/anunciamos-the-day-i-made-that-promise` | falló: net::ERR_FAILED | no | — | — | — | — | — | — | — |
| PWA-06 | GET | `/api/v1/news/anunciamos-the-day-i-made-that-promise` | falló: net::ERR_FAILED | no | — | — | — | — | — | — | — |
| PWA-07 | POST | `/api/v1/auth/refresh` | falló: net::ERR_INTERNET_DISCONNECTED | no | — | — | — | — | — | — | — |
| PWA-07 | GET | `/api/v1/achievements` | 200 | sí | 6 | 12 | — | — | max-age=3600, public | app;desc="Spring Boot";dur=7.5, db;desc="PostgreSQL";dur=1.4 | — |
| PWA-07 | GET | `/api/v1/news?page=0&size=3` | 200 | sí | 10 | 12 | — | — | max-age=300, public | app;desc="Spring Boot";dur=21.1, db;desc="PostgreSQL";dur=14.8 | — |
| PWA-07 | POST | `/api/v1/subscriptions` | 202 | sí | 32 | 33 | — | {"email":"lab-offline-20261122215254@tdimp.test","language":"es","consent":true} | — | — | 1 |
| PWA-09 | POST | `/api/v1/auth/refresh` | 401 | no | 14 | 16 | 191 | {} | — | app;desc="Spring Boot";dur=9.8, db;desc="PostgreSQL";dur=0.0 | — |
| PWA-09 | POST | `/api/v1/auth/register` | 201 | no | 209 | 215 | 487 | {"email":"lab-user-web-20261122215254@tdimp.test","username":"lab_web_22215254","password":"***","acceptedPrivacyNotice":true,"client":"WEB"} | no-store | app;desc="Spring Boot";dur=204.1, db;desc="PostgreSQL";dur=16.9 | — |
| PWA-09 | GET | `/api/v1/account/saves` | 200 | no | 26 | 28 | 2 | — | no-store | app;desc="Spring Boot";dur=22.2, db;desc="PostgreSQL";dur=9.9 | — |
| PWA-09 | GET | `/api/v1/account` | 200 | no | 27 | 30 | 328 | — | no-store | app;desc="Spring Boot";dur=20.4, db;desc="PostgreSQL";dur=17.0 | — |
| PWA-09 | GET | `/api/v1/account/history?page=0&size=5` | 200 | no | 47 | 51 | 76 | — | no-store | app;desc="Spring Boot";dur=40.9, db;desc="PostgreSQL";dur=29.4 | — |
| PWA-09 | POST | `/api/v1/auth/refresh` | 200 | no | 20 | 22 | 487 | {} | no-store | app;desc="Spring Boot";dur=15.6, db;desc="PostgreSQL";dur=8.4 | — |
