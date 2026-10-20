# Tráfico de red /api (2026-10-15T01:40:11.290Z)

Origen: http://localhost:4173

| Caso | Método | URL | Status | Desde SW | Latencia (TTFB) ms | Total ms | Payload enviado | Respuesta B | Cache-Control | Server-Timing | X-Queued |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CP-01 | GET | /api/v1/news?page=0&size=6 | 200 | no | 444 | 445 | 0 | 1444 | max-age=300, public | app;desc="Spring Boot";dur=439.1, db;desc="PostgreSQL";dur=251.2 | — |
| CP-01 | GET | /api/v1/news?page=0&size=6 | 200 | sí | 2 | 2 | 0 | 1444 | max-age=300, public | app;desc="Spring Boot";dur=439.1, db;desc="PostgreSQL";dur=251.2 | — |
| CP-02 | GET | /api/v1/news?page=1&size=6 | 200 | sí | 460 | 462 | 0 | 1400 | max-age=300, public | app;desc="Spring Boot";dur=440.9, db;desc="PostgreSQL";dur=201.1 | — |
| CP-03 | POST | /api/v1/subscriptions | 202 | sí | 335 | 336 | {"email":"lab-online-20261015014003@tdimp.test","language":"es","consent":true} | 0 | — | app;desc="Spring Boot";dur=322.8, db;desc="PostgreSQL";dur=107.2 | — |
| CP-04 | GET | /api/v1/news?page=0&size=6 | 200 | sí | 3 | 4 | 0 | 1444 | max-age=300, public | app;desc="Spring Boot";dur=439.1, db;desc="PostgreSQL";dur=251.2 | — |
| CP-05 | POST | /api/v1/subscriptions | 202 | sí | 7 | 7 | {"email":"lab-offline-20261015014003@tdimp.test","language":"es","consent":true} | 0 | — | — | 1 |