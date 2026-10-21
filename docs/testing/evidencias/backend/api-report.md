# Pruebas de la API (2026-10-21T20:45:31.152Z)

API: `http://localhost:8082` · cada fila es una petición directa a Spring Boot (sin navegador ni Service Worker).

| Caso | Petición | Descripción | Esperado | Status | Tiempo (ms) | Bytes | Content-Type | Cache-Control | Server-Timing | X-Request-Id | Resultado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| API-01 | `GET /api/v1/news?page=0&size=6` | Listado, primera página | 200 | 200 | 88 | 1440 | application/json | max-age=300, public | app;desc="Spring Boot";dur=78.6, db;desc="PostgreSQL";dur=31.6 | 679603c5 | ✔ 6 de 12 · max-age=300, public |
| API-02 | `GET /api/v1/news?page=1&size=6` | Listado, segunda página | 200 | 200 | 16 | 1394 | application/json | max-age=300, public | app;desc="Spring Boot";dur=10.3, db;desc="PostgreSQL";dur=4.1 | 745eb375 | ✔ página 2 de 2 |
| API-03 | `GET /api/v1/news/lab-devlog-06-forge` | Detalle de una noticia publicada | 200 | 200 | 46 | 334 | application/json | max-age=300, public | app;desc="Spring Boot";dur=30.2, db;desc="PostgreSQL";dur=4.1 | 40077631 | ✔ "Devlog #6: la forja" · 107 caracteres de Markdown |
| API-04 | `GET /api/v1/news/lab-draft-not-visible` | Un borrador no se publica | 404 | 404 | 34 | 201 | application/problem+json | — | app;desc="Spring Boot";dur=16.5, db;desc="PostgreSQL";dur=2.1 | 25a0a3cc | ✔ problem+json NOT_FOUND |
| API-05 | `GET /api/v1/news?size=51` | Tamaño de página fuera de rango | 400 | 400 | 52 | 278 | application/problem+json | — | app;desc="Spring Boot";dur=34.6, db;desc="PostgreSQL";dur=0.0 | e00c1416 | ✔ VALIDATION_FAILED · campo size |
| API-06 | `GET /api/v1/achievements` | Catálogo de logros | 200 | 200 | 19 | 850 | application/json | max-age=3600, public | app;desc="Spring Boot";dur=9.9, db;desc="PostgreSQL";dur=4.1 | 4c7b0190 | ✔ 6 logros, 2 oculto(s) sin descripción · max-age=3600, public |
| API-07 | `POST /api/v1/subscriptions` | Registro válido | 202 | 202 | 63 | 0 | — | — | app;desc="Spring Boot";dur=55.5, db;desc="PostgreSQL";dur=4.3 | 82608050 | ✔ lab-api-20261021204531@tdimp.test |
| API-08 | `POST /api/v1/subscriptions` | Mismo correo en mayúsculas (idempotente) | 202 | 202 | 17 | 0 | — | — | app;desc="Spring Boot";dur=6.3, db;desc="PostgreSQL";dur=1.6 | 0ea0d405 | ✔ sin fila nueva: se normaliza a minúsculas y ON CONFLICT DO NOTHING |
| API-09 | `POST /api/v1/subscriptions` | Correo inválido | 400 | 400 | 15 | 293 | application/problem+json | — | app;desc="Spring Boot";dur=6.7, db;desc="PostgreSQL";dur=0.0 | b3eb5216 | ✔ VALIDATION_FAILED · campo email |
| API-10 | `POST /api/v1/subscriptions` | Sin consentimiento | 400 | 400 | 21 | 277 | application/problem+json | — | app;desc="Spring Boot";dur=8.5, db;desc="PostgreSQL";dur=0.0 | b8926963 | ✔ VALIDATION_FAILED · campo consent |
| API-11 | `POST /api/v1/subscriptions` | Idioma no soportado | 400 | 400 | 17 | 283 | application/problem+json | — | app;desc="Spring Boot";dur=7.0, db;desc="PostgreSQL";dur=0.0 | 3187651f | ✔ VALIDATION_FAILED · campo language |
| API-12 | `POST /api/v1/subscriptions` | JSON mal formado | 400 | 400 | 24 | 283 | application/problem+json | — | app;desc="Spring Boot";dur=10.8, db;desc="PostgreSQL";dur=0.0 | 405c5417 | ✔ VALIDATION_FAILED · cuerpo ilegible |

## Latencia (20 peticiones seguidas por endpoint)

Tiempo total medido desde el cliente; `app` y `db` salen del header `Server-Timing` (promedio).

| Endpoint | n | mín | p50 | p95 | máx | promedio | app (Spring) | db (PostgreSQL) | Bytes | Todos 200 |
|---|---|---|---|---|---|---|---|---|---|---|
| `/api/v1/news?page=0&size=6` | 20 | 9.5 | 12.2 | 21.4 | 30.4 | 13.6 | 8.9 | 3.9 | 1440 | ✔ |
| `/api/v1/news/lab-devlog-06-forge` | 20 | 6.9 | 8.6 | 10.1 | 11.1 | 8.7 | 4.8 | 1.5 | 334 | ✔ |
| `/api/v1/achievements` | 20 | 6.6 | 8.0 | 9.1 | 9.6 | 8.0 | 4.3 | 1.4 | 850 | ✔ |

## Actuator al terminar

- Salud: **UP** · base de datos: **UP**
- Heap usado: 31.0 MB de 4066.0 MB
- Pool HikariCP: 0 activas, 5 libres, máximo 5

| URI | Peticiones atendidas | Promedio (ms) | Máximo (ms) |
|---|---|---|---|
| `/api/v1/news` | 23 | 11.9 | 74.5 |
| `/api/v1/news/{slug}` | 22 | 5.8 | 29.1 |
| `/api/v1/achievements` | 21 | 3.9 | 9.2 |
| `/api/v1/subscriptions` | 6 | 14.5 | 54.5 |
