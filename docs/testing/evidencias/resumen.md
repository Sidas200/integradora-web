# Resumen del recorrido automático

- Fecha: 2026-11-22T23:24:21.873Z
- API: `http://localhost:8082` · PWA: `http://localhost:4173` · Chromium 156.0.8078.4 · Node v24.20.0
- API: **16/16** casos · PWA: **9/9** casos

## API

| Caso | Descripción | Resultado | Detalle |
|---|---|---|---|
| API-01 | `GET /api/v1/news?page=0&size=6` Listado, primera página | PASA | 6 de 9 · max-age=300, public |
| API-02 | `GET /api/v1/news?page=1&size=6` Listado, segunda página | PASA | página 2 de 2 |
| API-03 | `GET /api/v1/news/diario-03-la-forja-de-kaede` Detalle de una noticia publicada | PASA | "Diario de desarrollo #3: la forja de Kaede" · 999 caracteres de Markdown |
| API-04 | `GET /api/v1/news/lo-que-viene-despues-del-capitulo-1` Un borrador no se publica | PASA | problem+json NOT_FOUND |
| API-05 | `GET /api/v1/news?size=51` Tamaño de página fuera de rango | PASA | VALIDATION_FAILED · campo size |
| API-06 | `GET /api/v1/achievements` Catálogo de logros | PASA | 6 logros, 2 oculto(s) sin descripción · max-age=3600, public |
| API-07 | `POST /api/v1/subscriptions` Registro válido | PASA | lab-api-20261122232421@tdimp.test |
| API-08 | `POST /api/v1/subscriptions` Mismo correo en mayúsculas (idempotente) | PASA | sin fila nueva: se normaliza a minúsculas y ON CONFLICT DO NOTHING |
| API-09 | `POST /api/v1/subscriptions` Correo inválido | PASA | VALIDATION_FAILED · campo email |
| API-10 | `POST /api/v1/subscriptions` Sin consentimiento | PASA | VALIDATION_FAILED · campo consent |
| API-11 | `POST /api/v1/subscriptions` Idioma no soportado | PASA | VALIDATION_FAILED · campo language |
| API-12 | `POST /api/v1/subscriptions` JSON mal formado | PASA | VALIDATION_FAILED · cuerpo ilegible |
| API-13 | `POST /api/v1/auth/register` Registro de jugador (creación) | PASA | lab-user-api-20261122232421@tdimp.test · Bearer, expira en 900 s · refresh token en cookie HttpOnly |
| API-14 | `GET /api/v1/account` Consulta del jugador recién creado (lectura) | PASA | lab_api_22232421 · lab-user-api-20261122232421@tdimp.test · id be12f88b… · creada 2026-11-22T23:24:22.294399Z |
| API-15 | `POST /api/v1/auth/register` Mismo correo otra vez | PASA | problem+json EMAIL_IN_USE · sin fila nueva (índice único ux_players_email) |
| API-16 | `GET /api/v1/account` Cuenta sin token | PASA | problem+json TOKEN_EXPIRED: los datos del jugador solo se leen con sesión |

## PWA

| Caso | Descripción | Resultado | Detalle | Duración |
|---|---|---|---|---|
| PWA-01 | Landing: GET de logros y últimas noticias renderizados; Service Worker activo | PASA | 6 logros (2 ocultos, sin descripción) y 3 noticias recientes | 6846 ms |
| PWA-02 | Noticias: listado paginado con "Cargar más" | PASA | 6 → 9 noticias · public-api con 4 respuestas | 2929 ms |
| PWA-03 | Detalle: GET /news/{slug} renderiza el Markdown | PASA | /news/ya-puedes-jugar-la-demo-del-capitulo-1 · "Ya puedes jugar la demo del capítulo 1" | 1969 ms |
| PWA-04 | Formulario en línea: POST /subscriptions responde 202 | PASA | lab-online-20261122232421@tdimp.test → 202 | 5673 ms |
| PWA-05 | Sin conexión: listado y detalle visitados salen de Cache Storage | PASA | Ya puedes jugar la demo del capítulo 1 · servido por el SW desde public-api | 3996 ms |
| PWA-06 | Sin conexión: una noticia nunca visitada muestra error y "Reintentar" | PASA | /news/anunciamos-the-day-i-made-that-promise · estado de error controlado (NETWORK_ERROR) | 2654 ms |
| PWA-07 | Sin conexión: el POST se guarda en IndexedDB (Background Sync) | PASA | 1 petición en subscription-queue: {"email":"lab-offline-20261122232421@tdimp.test","language":"es","consent":true} | 5330 ms |
| PWA-08 | Vuelve la red: la cola se envía, queda vacía y la PWA lo avisa | PASA | cola vacía · lab-offline-20261122232421@tdimp.test reenviado | 5878 ms |
| PWA-09 | Registro desde /register y consulta en /app/account (misma entidad: el jugador) | PASA | POST register 201 → GET account 200 · lab_web_22232421 / lab-user-web-20261122232421@tdimp.test | 6504 ms |

## Correos de esta corrida (bloque B de `03_evidencias.sql`)

- `lab-api-20261122232421@tdimp.test` (API-07; API-08 lo reenvió en mayúsculas: debe existir una sola fila)
- `lab-online-20261122232421@tdimp.test` (PWA-04, en línea)
- `lab-offline-20261122232421@tdimp.test` (PWA-07/08, encolado sin conexión y reenviado)

## Jugadores de esta corrida (bloque E de `03_evidencias.sql`)

- `lab-user-api-20261122232421@tdimp.test` · `lab_api_22232421` (API-13 lo creó, API-14 lo leyó, API-15 intentó repetirlo: debe existir una sola fila)
- `lab-user-web-20261122232421@tdimp.test` · `lab_web_22232421` (PWA-09, desde el formulario de /register)

## Archivos generados

- `backend/api-report.md`, `backend/trazas.md`, `backend/tdimp-api.log`
- `frontend/ui-01` a `ui-11`, `frontend/network.har`, `frontend/network-report.md`, `frontend/application-report.json`, `frontend/console.log`
