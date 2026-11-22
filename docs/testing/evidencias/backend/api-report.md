# Pruebas de la API (2026-11-22T21:52:54.978Z)

API: `http://localhost:8082` · cada fila es una petición directa a Spring Boot (sin navegador ni Service Worker).

| Caso | Petición | Descripción | Esperado | Status | Tiempo (ms) | Bytes | Content-Type | Cache-Control | Server-Timing | X-Request-Id | Resultado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| API-01 | `GET /api/v1/news?page=0&size=6` | Listado, primera página | 200 | 200 | 21 | 1852 | application/json | max-age=300, public | app;desc="Spring Boot";dur=9.4, db;desc="PostgreSQL";dur=3.2 | ec8c79f6 | ✔ 6 de 9 · max-age=300, public |
| API-02 | `GET /api/v1/news?page=1&size=6` | Listado, segunda página | 200 | 200 | 16 | 989 | application/json | max-age=300, public | app;desc="Spring Boot";dur=8.0, db;desc="PostgreSQL";dur=3.2 | 4c0c5bb0 | ✔ página 2 de 2 |
| API-03 | `GET /api/v1/news/diario-03-la-forja-de-kaede` | Detalle de una noticia publicada | 200 | 200 | 26 | 1332 | application/json | max-age=300, public | app;desc="Spring Boot";dur=19.6, db;desc="PostgreSQL";dur=2.2 | 91fe6f59 | ✔ "Diario de desarrollo #3: la forja de Kaede" · 1002 caracteres de Markdown |
| API-04 | `GET /api/v1/news/lo-que-viene-despues-del-capitulo-1` | Un borrador no se publica | 404 | 404 | 17 | 229 | application/problem+json | — | app;desc="Spring Boot";dur=7.7, db;desc="PostgreSQL";dur=1.8 | 8d8bc795 | ✔ problem+json NOT_FOUND |
| API-05 | `GET /api/v1/news?size=51` | Tamaño de página fuera de rango | 400 | 400 | 49 | 278 | application/problem+json | — | app;desc="Spring Boot";dur=36.7, db;desc="PostgreSQL";dur=0.0 | 1abf3483 | ✔ VALIDATION_FAILED · campo size |
| API-06 | `GET /api/v1/achievements` | Catálogo de logros | 200 | 200 | 14 | 850 | application/json | max-age=3600, public | app;desc="Spring Boot";dur=9.5, db;desc="PostgreSQL";dur=3.9 | 6487855a | ✔ 6 logros, 2 oculto(s) sin descripción · max-age=3600, public |
| API-07 | `POST /api/v1/subscriptions` | Registro válido | 202 | 202 | 49 | 0 | — | — | app;desc="Spring Boot";dur=39.9, db;desc="PostgreSQL";dur=3.4 | bb8ce611 | ✔ lab-api-20261122215254@tdimp.test |
| API-08 | `POST /api/v1/subscriptions` | Mismo correo en mayúsculas (idempotente) | 202 | 202 | 31 | 0 | — | — | app;desc="Spring Boot";dur=10.0, db;desc="PostgreSQL";dur=2.3 | a933f7b3 | ✔ sin fila nueva: se normaliza a minúsculas y ON CONFLICT DO NOTHING |
| API-09 | `POST /api/v1/subscriptions` | Correo inválido | 400 | 400 | 30 | 293 | application/problem+json | — | app;desc="Spring Boot";dur=9.2, db;desc="PostgreSQL";dur=0.0 | b3fe8dc8 | ✔ VALIDATION_FAILED · campo email |
| API-10 | `POST /api/v1/subscriptions` | Sin consentimiento | 400 | 400 | 27 | 277 | application/problem+json | — | app;desc="Spring Boot";dur=5.8, db;desc="PostgreSQL";dur=0.0 | 57cf765e | ✔ VALIDATION_FAILED · campo consent |
| API-11 | `POST /api/v1/subscriptions` | Idioma no soportado | 400 | 400 | 18 | 283 | application/problem+json | — | app;desc="Spring Boot";dur=9.4, db;desc="PostgreSQL";dur=0.0 | 33a754c2 | ✔ VALIDATION_FAILED · campo language |
| API-12 | `POST /api/v1/subscriptions` | JSON mal formado | 400 | 400 | 20 | 283 | application/problem+json | — | app;desc="Spring Boot";dur=10.4, db;desc="PostgreSQL";dur=0.0 | 73ab1596 | ✔ VALIDATION_FAILED · cuerpo ilegible |
| API-13 | `POST /api/v1/auth/register` | Registro de jugador (creación) | 201 | 201 | 265 | 487 | application/json | no-store | app;desc="Spring Boot";dur=258.6, db;desc="PostgreSQL";dur=39.7 | b0856b63 | ✔ lab-user-api-20261122215254@tdimp.test · Bearer, expira en 900 s · refresh token en cookie HttpOnly |
| API-14 | `GET /api/v1/account` | Consulta del jugador recién creado (lectura) | 200 | 200 | 42 | 328 | application/json | no-store | app;desc="Spring Boot";dur=37.1, db;desc="PostgreSQL";dur=19.0 | 0a76b4bf | ✔ lab_api_22215254 · lab-user-api-20261122215254@tdimp.test · id 80c83b76… · creada 2026-11-22T21:52:55.428533Z |
| API-15 | `POST /api/v1/auth/register` | Mismo correo otra vez | 409 | 409 | 11 | 227 | application/problem+json | — | app;desc="Spring Boot";dur=5.4, db;desc="PostgreSQL";dur=1.4 | e1bb2fa9 | ✔ problem+json EMAIL_IN_USE · sin fila nueva (índice único ux_players_email) |
| API-16 | `GET /api/v1/account` | Cuenta sin token | 401 | 401 | 7 | 190 | application/problem+json | — | app;desc="Spring Boot";dur=3.2, db;desc="PostgreSQL";dur=0.0 | 117a1512 | ✔ problem+json TOKEN_EXPIRED: los datos del jugador solo se leen con sesión |

## Latencia (20 peticiones seguidas por endpoint)

Tiempo total medido desde el cliente; `app` y `db` salen del header `Server-Timing` (promedio).

| Endpoint | n | mín | p50 | p95 | máx | promedio | app (Spring) | db (PostgreSQL) | Bytes | Todos 200 |
|---|---|---|---|---|---|---|---|---|---|---|
| `/api/v1/news?page=0&size=6` | 20 | 9.4 | 10.8 | 13.1 | 13.2 | 11.1 | 6.9 | 2.7 | 1852 | ✔ |
| `/api/v1/news/diario-03-la-forja-de-kaede` | 20 | 6.7 | 7.9 | 12.2 | 88.9 | 12.3 | 8.5 | 5.2 | 1332 | ✔ |
| `/api/v1/achievements` | 20 | 6.1 | 6.6 | 7.3 | 7.9 | 6.7 | 3.6 | 1.1 | 850 | ✔ |

## Actuator al terminar

- Salud: **UP** · base de datos: **UP**
- Heap usado: 90.2 MB de 4066.0 MB
- Pool HikariCP: 0 activas, 5 libres, máximo 5

| URI | Peticiones atendidas | Promedio (ms) | Máximo (ms) |
|---|---|---|---|
| `/api/v1/news` | 24 | 11.1 | 35.8 |
| `/api/v1/news/{slug}` | 22 | 8.4 | 83.5 |
| `/api/v1/achievements` | 21 | 3.4 | 9.0 |
| `/api/v1/subscriptions` | 6 | 12.9 | 39.0 |
| `/api/v1/auth/register` | 2 | 131.1 | 257.2 |
| `/api/v1/account` | 2 | 19.6 | 36.6 |
