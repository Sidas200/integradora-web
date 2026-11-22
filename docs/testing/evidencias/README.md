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
| `db-05-jugadores.png` | manual | E | DB-05 |

## backend/ · Spring Boot

| Archivo | Tipo | Contenido |
|---|---|---|
| `api-report.md` | auto | Casos API-01 a API-16 (status, tiempo, bytes, headers), serie de latencia y métricas de Actuator |
| `trazas.md` | auto | Una fila por petición sacada del log: código, tiempo total, consultas y tiempo en BD, bytes y heap |
| `tdimp-api.log` | auto | Líneas del log de Spring Boot durante el recorrido (`-->`, `<--`, SQL y `BD ...`) |
| `backend-01-consola.png` | manual | Terminal con las trazas de un `POST /subscriptions`, un `POST /auth/register` y un `GET /news` |
| `mvn-verify.txt` | manual | Salida de `./mvnw verify` (unitarias, integración y ArchUnit) |

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
| `ui-10-cuenta-creada.png` | auto | PWA-09 panel del jugador tras el registro |
| `ui-11-mi-cuenta.png` | auto | PWA-09 cuenta leída con `GET /account` |
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
| `devtools-08-network-registro.png` | manual | Network: `POST /auth/register` (201) y `GET /account` (200) |
| `npm-test.txt` | auto | Salida de `npm run test:coverage`: 293 pruebas y resumen de cobertura |

## unitarias/ · Práctica de `findAll` y `create` (JUnit 5 + Mockito)

| Archivo | Contenido |
|---|---|
| `01-pom-dependencias.png` | `spring-boot-starter-test` en `pom.xml` |
| `02-test-findall.png` | Clase `AchievementServiceFindAllTest` |
| `03-test-create.png` | Clase `SubscriptionServiceCreateTest` |
| `04-ejecucion-ide.png` | Pruebas en verde en VS Code |
| `05-ejecucion-mvn.png` | `BUILD SUCCESS` en la terminal |

## Checklist manual

Las capturas de la versión anterior del laboratorio (sin diseño, con las noticias `lab-*`) se reemplazan en la corrida final. Las de `unitarias/` siguen vigentes: el código de esas pruebas no cambió.

- [ ] db-01-antes.png
- [ ] db-02-despues.png
- [ ] db-03-integridad.png
- [ ] db-04-explain.png
- [ ] db-05-jugadores.png (nueva)
- [ ] backend-01-consola.png
- [ ] mvn-verify.txt
- [ ] devtools-01-console.png
- [ ] devtools-02-network-get.png
- [ ] devtools-03-application-sw.png
- [ ] devtools-04-cache-storage.png
- [ ] devtools-05-network-post.png
- [ ] devtools-06-indexeddb-cola.png
- [ ] devtools-07-sincronizado.png
- [ ] devtools-08-network-registro.png (nueva)
- [x] unitarias/01 a 05
