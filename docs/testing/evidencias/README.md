# Evidencias

*auto* = lo genera `npm run lab:evidence` · *manual* = captura propia (pasos en `../README.md`, sección 5).

## Resumen

| Archivo | Tipo | Contenido |
|---|---|---|
| `resumen.md` | auto | Resultado de los casos API y PWA, correos usados y archivos generados |

## db/ · Persistencia en PostgreSQL

| Archivo | Tipo | Bloque de `03_evidencias.sql` | Caso |
|---|---|---|---|
| `db-01-antes.png` | manual | A, después de `02_carga.sql` | DB-01 |
| `db-02-despues.png` | manual | B, después del recorrido | DB-02 |
| `db-03-integridad.png` | manual | C | DB-03 |
| `db-04-explain.png` | manual | D | DB-04 |

## backend/ · Spring Boot

| Archivo | Tipo | Contenido |
|---|---|---|
| `api-report.md` | auto | Casos API-01 a API-12 (status, tiempo, bytes, headers), serie de latencia y métricas de Actuator |
| `trazas.md` | auto | Una fila por petición sacada del log: código, tiempo total, consultas y tiempo en BD, bytes y heap |
| `tdimp-api.log` | auto | Líneas del log de Spring Boot durante el recorrido (`-->`, `<--`, SQL y `BD ...`) |
| `backend-01-consola.png` | manual | Terminal con las trazas de un `POST /subscriptions` y un `GET /news` |
| `mvn-verify.txt` | opcional | Salida de `./mvnw verify` |

## frontend/ · PWA y DevTools

| Archivo | Tipo | Caso / contenido |
|---|---|---|
| `ui-01-landing.png` | auto | PWA-01 logros y noticias recientes |
| `ui-02-noticias.png` | auto | PWA-02 listado tras el `GET` y *Cargar más* |
| `ui-03-detalle.png` | auto | PWA-03 detalle |
| `ui-04-registro-en-linea.png` | auto | PWA-04 `POST` en línea |
| `ui-05-offline-noticias.png` | auto | PWA-05 listado sin conexión desde caché |
| `ui-06-offline-detalle.png` | auto | PWA-05 detalle sin conexión desde caché |
| `ui-07-offline-sin-copia.png` | auto | PWA-06 página no visitada sin conexión |
| `ui-08-offline-en-cola.png` | auto | PWA-07 `POST` encolado |
| `ui-09-sincronizado.png` | auto | PWA-08 cola enviada al volver la red |
| `network.har` | auto | Tráfico `/api` completo (se abre en DevTools › Network › Import) |
| `network-report.md` | auto | Tabla de cada petición: status, desde SW, TTFB, total, bytes, payload, headers |
| `application-report.json` | auto | Service Worker, Cache Storage e IndexedDB en tres momentos |
| `console.log` | auto | Consola de la página y del Service Worker |
| `devtools-01-console.png` | manual | Console durante la consulta y el render |
| `devtools-02-network-get.png` | manual | Network: latencia, tamaño y headers del `GET` |
| `devtools-03-application-sw.png` | manual | Service Worker activo |
| `devtools-04-cache-storage.png` | manual | Cache Storage `public-api` |
| `devtools-05-network-post.png` | manual | Network: payload y 202 del `POST` |
| `devtools-06-indexeddb-cola.png` | manual | IndexedDB con la petición en cola (sin conexión) |
| `devtools-07-sincronizado.png` | manual | Cola vacía tras sincronizar |
| `npm-test.txt` | opcional | Salida de `npm test` |

## Checklist manual

- [x] db-01-antes.png
- [x] db-02-despues.png
- [x] db-03-integridad.png
- [x] db-04-explain.png
- [x] backend-01-consola.png
- [x] devtools-01-console.png
- [x] devtools-02-network-get.png
- [x] devtools-03-application-sw.png
- [x] devtools-04-cache-storage.png
- [x] devtools-05-network-post.png
- [x] devtools-06-indexeddb-cola.png
- [x] devtools-07-sincronizado.png