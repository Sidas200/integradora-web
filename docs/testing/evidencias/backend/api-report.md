# Pruebas de la API (2026-11-22T23:24:21.873Z)

API: `http://localhost:8082` · cada fila es una petición directa a Spring Boot (sin navegador ni Service Worker).

| Caso | Petición | Descripción | Esperado | Status | Tiempo (ms) | Bytes | Content-Type | Cache-Control | Server-Timing | X-Request-Id | Resultado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| API-01 | `GET /api/v1/news?page=0&size=6` | Listado, primera página | 200 | 200 | 16 | 1852 | application/json | max-age=300, public | app;desc="Spring Boot";dur=8.1, db;desc="PostgreSQL";dur=2.9 | 092ccec2 | ✔ 6 de 9 · max-age=300, public |
| API-02 | `GET /api/v1/news?page=1&size=6` | Listado, segunda página | 200 | 200 | 14 | 989 | application/json | max-age=300, public | app;desc="Spring Boot";dur=9.2, db;desc="PostgreSQL";dur=3.0 | b353f1dd | ✔ página 2 de 2 |
| API-03 | `GET /api/v1/news/diario-03-la-forja-de-kaede` | Detalle de una noticia publicada | 200 | 200 | 19 | 1329 | application/json | max-age=300, public | app;desc="Spring Boot";dur=14.1, db;desc="PostgreSQL";dur=3.3 | 2fb3341d | ✔ "Diario de desarrollo #3: la forja de Kaede" · 999 caracteres de Markdown |
| API-04 | `GET /api/v1/news/lo-que-viene-despues-del-capitulo-1` | Un borrador no se publica | 404 | 404 | 20 | 229 | application/problem+json | — | app;desc="Spring Boot";dur=9.9, db;desc="PostgreSQL";dur=1.0 | c94e447e | ✔ problem+json NOT_FOUND |
| API-05 | `GET /api/v1/news?size=51` | Tamaño de página fuera de rango | 400 | 400 | 41 | 278 | application/problem+json | — | app;desc="Spring Boot";dur=29.8, db;desc="PostgreSQL";dur=0.0 | c96b9951 | ✔ VALIDATION_FAILED · campo size |
| API-06 | `GET /api/v1/achievements` | Catálogo de logros | 200 | 200 | 11 | 850 | application/json | max-age=3600, public | app;desc="Spring Boot";dur=5.1, db;desc="PostgreSQL";dur=1.8 | 6a656712 | ✔ 6 logros, 2 oculto(s) sin descripción · max-age=3600, public |
| API-07 | `POST /api/v1/subscriptions` | Registro válido | 202 | 202 | 118 | 0 | — | — | app;desc="Spring Boot";dur=109.9, db;desc="PostgreSQL";dur=13.8 | 4f689f23 | ✔ lab-api-20261122232421@tdimp.test |
| API-08 | `POST /api/v1/subscriptions` | Mismo correo en mayúsculas (idempotente) | 202 | 202 | 23 | 0 | — | — | app;desc="Spring Boot";dur=16.0, db;desc="PostgreSQL";dur=1.2 | 2d0dd738 | ✔ sin fila nueva: se normaliza a minúsculas y ON CONFLICT DO NOTHING |
| API-09 | `POST /api/v1/subscriptions` | Correo inválido | 400 | 400 | 13 | 293 | application/problem+json | — | app;desc="Spring Boot";dur=7.9, db;desc="PostgreSQL";dur=0.0 | 3c9108fb | ✔ VALIDATION_FAILED · campo email |
| API-10 | `POST /api/v1/subscriptions` | Sin consentimiento | 400 | 400 | 7 | 277 | application/problem+json | — | app;desc="Spring Boot";dur=3.7, db;desc="PostgreSQL";dur=0.0 | 963b62d1 | ✔ VALIDATION_FAILED · campo consent |
| API-11 | `POST /api/v1/subscriptions` | Idioma no soportado | 400 | 400 | 11 | 283 | application/problem+json | — | app;desc="Spring Boot";dur=5.2, db;desc="PostgreSQL";dur=0.0 | ae232ff6 | ✔ VALIDATION_FAILED · campo language |
| API-12 | `POST /api/v1/subscriptions` | JSON mal formado | 400 | 400 | 12 | 283 | application/problem+json | — | app;desc="Spring Boot";dur=5.8, db;desc="PostgreSQL";dur=0.0 | d6e79ee0 | ✔ VALIDATION_FAILED · cuerpo ilegible |
| API-13 | `POST /api/v1/auth/register` | Registro de jugador (creación) | 201 | 201 | 140 | 487 | application/json | no-store | app;desc="Spring Boot";dur=134.0, db;desc="PostgreSQL";dur=11.7 | 2dbdc5e3 | ✔ lab-user-api-20261122232421@tdimp.test · Bearer, expira en 900 s · refresh token en cookie HttpOnly |
| API-14 | `GET /api/v1/account` | Consulta del jugador recién creado (lectura) | 200 | 200 | 26 | 328 | application/json | no-store | app;desc="Spring Boot";dur=22.2, db;desc="PostgreSQL";dur=8.3 | ee96618e | ✔ lab_api_22232421 · lab-user-api-20261122232421@tdimp.test · id be12f88b… · creada 2026-11-22T23:24:22.294399Z |
| API-15 | `POST /api/v1/auth/register` | Mismo correo otra vez | 409 | 409 | 10 | 227 | application/problem+json | — | app;desc="Spring Boot";dur=5.8, db;desc="PostgreSQL";dur=2.0 | dad1d92b | ✔ problem+json EMAIL_IN_USE · sin fila nueva (índice único ux_players_email) |
| API-16 | `GET /api/v1/account` | Cuenta sin token | 401 | 401 | 7 | 190 | application/problem+json | — | app;desc="Spring Boot";dur=2.9, db;desc="PostgreSQL";dur=0.0 | e24a3e3d | ✔ problem+json TOKEN_EXPIRED: los datos del jugador solo se leen con sesión |

## Latencia (20 peticiones seguidas por endpoint)

Tiempo total medido desde el cliente; `app` y `db` salen del header `Server-Timing` (promedio).

| Endpoint | n | mín | p50 | p95 | máx | promedio | app (Spring) | db (PostgreSQL) | Bytes | Todos 200 |
|---|---|---|---|---|---|---|---|---|---|---|
| `/api/v1/news?page=0&size=6` | 20 | 6.9 | 9.1 | 10.8 | 12.0 | 9.3 | 5.8 | 2.3 | 1852 | ✔ |
| `/api/v1/news/diario-03-la-forja-de-kaede` | 20 | 4.6 | 6.1 | 7.9 | 8.2 | 6.2 | 3.4 | 1.0 | 1329 | ✔ |
| `/api/v1/achievements` | 20 | 4.2 | 4.7 | 5.5 | 5.9 | 4.8 | 2.5 | 0.7 | 850 | ✔ |

## Actuator al terminar

- Salud: **UP** · base de datos: **UP**
- Heap usado: 45.6 MB de 4066.0 MB
- Pool HikariCP: 0 activas, 5 libres, máximo 5

| URI | Peticiones atendidas | Promedio (ms) | Máximo (ms) |
|---|---|---|---|
| `/api/v1/news` | 24 | 13.9 | 28.8 |
| `/api/v1/news/{slug}` | 22 | 3.7 | 13.5 |
| `/api/v1/achievements` | 22 | 10.4 | 4.5 |
| `/api/v1/subscriptions` | 6 | 24.1 | 109.3 |
| `/api/v1/auth/register` | 2 | 69.3 | 133.5 |
| `/api/v1/account` | 2 | 11.9 | 21.5 |
