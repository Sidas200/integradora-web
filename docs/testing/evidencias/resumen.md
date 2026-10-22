# Resumen del recorrido automático

- Fecha: 2026-10-21T20:45:31.152Z
- API: `http://localhost:8082` · PWA: `http://localhost:4173` · Chromium 156.0.8078.4 · Node v24.20.0
- API: **12/12** casos · PWA: **8/8** casos

## API

| Caso | Descripción | Resultado | Detalle |
|---|---|---|---|
| API-01 | `GET /api/v1/news?page=0&size=6` Listado, primera página | PASA | 6 de 12 · max-age=300, public |
| API-02 | `GET /api/v1/news?page=1&size=6` Listado, segunda página | PASA | página 2 de 2 |
| API-03 | `GET /api/v1/news/lab-devlog-06-forge` Detalle de una noticia publicada | PASA | "Devlog #6: la forja" · 107 caracteres de Markdown |
| API-04 | `GET /api/v1/news/lab-draft-not-visible` Un borrador no se publica | PASA | problem+json NOT_FOUND |
| API-05 | `GET /api/v1/news?size=51` Tamaño de página fuera de rango | PASA | VALIDATION_FAILED · campo size |
| API-06 | `GET /api/v1/achievements` Catálogo de logros | PASA | 6 logros, 2 oculto(s) sin descripción · max-age=3600, public |
| API-07 | `POST /api/v1/subscriptions` Registro válido | PASA | lab-api-20261021204531@tdimp.test |
| API-08 | `POST /api/v1/subscriptions` Mismo correo en mayúsculas (idempotente) | PASA | sin fila nueva: se normaliza a minúsculas y ON CONFLICT DO NOTHING |
| API-09 | `POST /api/v1/subscriptions` Correo inválido | PASA | VALIDATION_FAILED · campo email |
| API-10 | `POST /api/v1/subscriptions` Sin consentimiento | PASA | VALIDATION_FAILED · campo consent |
| API-11 | `POST /api/v1/subscriptions` Idioma no soportado | PASA | VALIDATION_FAILED · campo language |
| API-12 | `POST /api/v1/subscriptions` JSON mal formado | PASA | VALIDATION_FAILED · cuerpo ilegible |

## PWA

| Caso | Descripción | Resultado | Detalle | Duración |
|---|---|---|---|---|
| PWA-01 | Landing: GET de logros y últimas noticias renderizados; Service Worker activo | PASA | 6 logros (2 ocultos, sin descripción) y 3 noticias recientes | 2119 ms |
| PWA-02 | Noticias: listado paginado con "Cargar más" | PASA | 6 → 12 noticias · public-api con 4 respuestas | 1504 ms |
| PWA-03 | Detalle: GET /news/{slug} renderiza el Markdown | PASA | /news/announcing-the-day-i-made-that-promise · "Anunciamos The Day I Made That Promise" | 485 ms |
| PWA-04 | Formulario en línea: POST /subscriptions responde 202 | PASA | lab-online-20261021204531@tdimp.test → 202 | 1049 ms |
| PWA-05 | Sin conexión: listado y detalle visitados salen de Cache Storage | PASA | Anunciamos The Day I Made That Promise · servido por el SW desde public-api | 820 ms |
| PWA-06 | Sin conexión: una noticia nunca visitada muestra error y "Reintentar" | PASA | /news/lab-devlog-02-tsuki-controls · estado de error controlado (NETWORK_ERROR) | 1508 ms |
| PWA-07 | Sin conexión: el POST se guarda en IndexedDB (Background Sync) | PASA | 1 petición en subscription-queue: {"email":"lab-offline-20261021204531@tdimp.test","language":"es","consent":true} | 772 ms |
| PWA-08 | Vuelve la red: la cola se envía, queda vacía y la PWA lo avisa | PASA | cola vacía · lab-offline-20261021204531@tdimp.test reenviado | 1423 ms |

## Correos de esta corrida (bloque B de `03_evidencias.sql`)

- `lab-api-20261021204531@tdimp.test` (API-07; API-08 lo reenvió en mayúsculas: debe existir una sola fila)
- `lab-online-20261021204531@tdimp.test` (PWA-04, en línea)
- `lab-offline-20261021204531@tdimp.test` (PWA-07/08, encolado sin conexión y reenviado)

## Archivos generados

- `backend/api-report.md`, `backend/trazas.md`, `backend/tdimp-api.log`
- `frontend/ui-01` a `ui-09`, `frontend/network.har`, `frontend/network-report.md`, `frontend/application-report.json`, `frontend/console.log`
