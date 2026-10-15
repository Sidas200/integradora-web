# Resumen del recorrido automático

- Fecha: 2026-10-15T01:40:11.290Z
- PWA: http://localhost:4173
- Correo enviado en línea: `lab-online-20261015014003@tdimp.test`
- Correo enviado sin conexión: `lab-offline-20261015014003@tdimp.test`

| Caso | Descripción | Resultado | Detalle | Duración |
|---|---|---|---|---|
| CP-01 | GET /news: el listado se consulta y se renderiza | PASA | 6 noticias en pantalla | 1804 ms |
| CP-02 | GET /news?page=1: paginación (Cargar más) | PASA | 12 noticias · SW activated · caches: workbox-precache-v2-http://localhost:4173/(10), public-api(2) | 1145 ms |
| CP-03 | POST /subscriptions en línea: 202 y registro en BD | PASA | lab-online-20261015014003@tdimp.test -> 202 | 570 ms |
| CP-04 | Sin conexión: el listado se sirve desde Cache Storage | PASA | 6 noticias visibles sin red, servidas por el SW desde public-api | 792 ms |
| CP-05 | POST sin conexión: se encola en IndexedDB (Background Sync) | PASA | 1 petición(es) en subscription-queue: {"email":"lab-offline-20261015014003@tdimp.test","language":"es","consent":true} | 758 ms |
| CP-06 | Vuelve la red: la cola se sincroniza y llega a la BD | PASA | cola vacía; lab-offline-20261015014003@tdimp.test reenviado | 2585 ms |

Comprobación en la base de datos (bloque B de `docs/testing/sql/03_evidence_queries.sql`):

```sql
select email, language, source, consented_at, created_at from game.launch_subscriptions
where email in ('lab-online-20261015014003@tdimp.test', 'lab-offline-20261015014003@tdimp.test');
```