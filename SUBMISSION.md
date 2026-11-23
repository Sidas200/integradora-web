# Entrega · Aplicación Web Progresiva (proyecto integrador)

| | |
|---|---|
| Proyecto | *The Day I Made That Promise* |
| Materia | Aplicaciones Web Progresivas (IDGS101N) |
| Equipo | Hex Studio: Jáuregui Iracheta Víctor Yahir · Medellín Salcedo Santiago · Molina Reza Omar Gael · Ramos Juárez Brenda Regina · Rodríguez González Emmanuel · Sidas Rodríguez Pedro Arturo |
| Institución | Universidad Tecnológica de Chihuahua |
| Fecha | Noviembre de 2026 |
| Repositorio | <https://github.com/Sidas200/integradora-web> · se revisa la rama **`main`** |
| Documento técnico | [README.md](README.md) |

## Requisitos del proyecto integrador (PWA)

| Requisito | Dónde se cumple |
|---|---|
| Aplicación PWA | [`frontend/`](frontend): React + Vite con manifiesto, Service Worker, modo sin conexión e instalación ([README §8](README.md#8-estrategia-pwa)) |
| Script de importación de base de datos `.sql` | [`docs/db/`](docs/db): `V1__initial_schema.sql`, `V2__initial_data.sql`, `V3__chapter1_catalog.sql`, `news_hex_studio.sql`, `app_role.sql` y `verify_schema.sql`; pasos para importar en [README §6](README.md#6-base-de-datos) |
| Operaciones de creación y consulta de datos en base de datos | Registro del jugador (`POST /auth/register` → `players`) y su consulta (`GET /account`); aviso de lanzamiento (`POST /subscriptions` → `launch_subscriptions`); noticias y logros (`GET /news`, `GET /achievements`). [README §2.2](README.md#22-casos-de-uso-y-crud) y evidencias en el laboratorio (DB-01, DB-02, DB-05) |
| Microservicio (core/base) | [`backend/`](backend): API REST en Spring Boot con arquitectura en N-capas, contrato [`docs/api/openapi.yaml`](docs/api/openapi.yaml); la consumen la PWA, el juego y la app móvil ([README §4](README.md#4-arquitectura)) |
| Documentación del proceso de desarrollo y pruebas en Markdown | [README.md](README.md) (arquitectura, decisiones y cambios respecto a la propuesta en §12), [`docs/testing/README.md`](docs/testing/README.md) (laboratorio de pruebas), [`backend/README.md`](backend/README.md) (ejecución y práctica de pruebas unitarias), [`docs/ci/README.md`](docs/ci/README.md) (pipelines) |
| URL de repositorio remoto | <https://github.com/Sidas200/integradora-web> |

## Propuesta de arquitectura e interfaz

| Requisito | Sección del README |
|---|---|
| Arquitectura | [§4 Arquitectura](README.md#4-arquitectura): contexto, despliegue, backend en capas `controller` / `service` / `repository` / `dto` / `model`, frontend modular |
| Interfaz (contratos entre componentes) | [§5 Interfaces](README.md#5-interfaces) |
| Consumo de API: endpoints remotos | [§7.2 Endpoints](README.md#72-endpoints), [§7.4 Cliente HTTP](README.md#74-cliente-http) y el contrato [`docs/api/openapi.yaml`](docs/api/openapi.yaml) |
| Consumo de API: recuperación y renderizado dinámico de listas | [§7.5 Listas dinámicas](README.md#75-listas-dinámicas) |
| Estrategia PWA: manifiesto | [§8.1 Manifiesto](README.md#81-manifiesto) |
| Estrategia PWA: Service Worker | [§8.2](README.md#82-qué-guarda-cada-caché) a [§8.4](README.md#84-ciclo-de-vida-y-actualización) |
| Estrategia PWA: soporte offline | [§8.5 Sin conexión](README.md#85-sin-conexión) |
| Estrategia PWA: segundo plano | [§8.6 Funcionamiento en segundo plano](README.md#86-funcionamiento-en-segundo-plano) |
| UI/UX: estructura modular en JavaScript/CSS | [§9.2 Estructura modular en JavaScript y CSS](README.md#92-estructura-modular-en-javascript-y-css) |
| UI/UX: diseño adaptativo | [§9.3 Diseño adaptativo](README.md#93-diseño-adaptativo) |
| Base de datos | [§6 Base de datos](README.md#6-base-de-datos) y scripts en [`docs/db/`](docs/db) |
| Diagramas | [`docs/img/`](docs/img) (imágenes) y [`docs/diagrams/`](docs/diagrams), [`docs/design/boards/`](docs/design/boards) (fuentes editables) |

## Laboratorio de pruebas

| Entregable | Dónde |
|---|---|
| Directorio con documentación y evidencias | [`docs/testing/`](docs/testing/README.md) · índice de evidencias en [`docs/testing/evidencias/README.md`](docs/testing/evidencias/README.md) |
| Scripts de carga y limpieza | [`docs/testing/sql/`](docs/testing/sql): `01_limpieza.sql`, `02_carga.sql`, `03_evidencias.sql` |
| Capturas o logs de queries antes y después del envío | `evidencias/db/`: `db-01-antes`, `db-02-despues`, `db-03-integridad`, `db-04-explain`, `db-05-jugadores` |
| Logs del servidor backend (POST y GET, memoria, tiempos, códigos) | `evidencias/backend/`: `tdimp-api.log`, `trazas.md`, `api-report.md`, `backend-01-consola.png` |
| Interfaz: listado renderizado tras el `GET` | `evidencias/frontend/`: `ui-01` a `ui-11` |
| DevTools: Network (latencia, payload, headers) | `devtools-02-network-get`, `devtools-05-network-post`, `devtools-08-network-registro`, `network.har`, `network-report.md` |
| DevTools: Application (Service Worker, Cache Storage, IndexedDB, sincronización) | `devtools-03` a `devtools-07`, `application-report.json` |
| DevTools: Console | `devtools-01-console.png`, `console.log` |

## Pruebas unitarias (JUnit 5 y Mockito)

Práctica *findAll* y *create* en la capa de servicios: [`backend/README.md`](backend/README.md#práctica-pruebas-unitarias-de-findall-y-create), clases `AchievementServiceFindAllTest` y `SubscriptionServiceCreateTest`, evidencias en [`docs/testing/evidencias/unitarias/`](docs/testing/evidencias/unitarias).

## Diagramas incluidos

| Diagrama | Archivo |
|---|---|
| Contexto | [`01-context.png`](docs/img/01-context.png) |
| Contenedores y despliegue | [`02-deployment.png`](docs/img/02-deployment.png) |
| Backend en capas (controller, service, repository, dto, model) | [`03-backend-layers.png`](docs/img/03-backend-layers.png) |
| Frontend modular e interfaces entre módulos | [`04-frontend-modules.png`](docs/img/04-frontend-modules.png) |
| Casos de uso | [`05-use-cases.png`](docs/img/05-use-cases.png) |
| Modelo entidad-relación | [`06-er.png`](docs/img/06-er.png) |
| Secuencia: consumo de una lista con caché y sin conexión | [`07-sequence-api-list.png`](docs/img/07-sequence-api-list.png) |
| Secuencia: Background Sync | [`08-sequence-background-sync.png`](docs/img/08-sequence-background-sync.png) |
| Estados del Service Worker | [`09-service-worker-lifecycle.png`](docs/img/09-service-worker-lifecycle.png) |
| Mapa de navegación | [`10-navigation.png`](docs/img/10-navigation.png) |
| Secuencia: inicio de sesión y renovación | [`11-sequence-login-refresh.png`](docs/img/11-sequence-login-refresh.png) |
| Secuencia: eliminación de cuenta | [`12-sequence-delete-account.png`](docs/img/12-sequence-delete-account.png) |
| Clases: interfaces de autenticación | [`13-auth-interfaces.png`](docs/img/13-auth-interfaces.png) |
| Página principal (diseño final) | [`ui-landing.png`](docs/img/ui-landing.png) |
| Hoja de estilo de la propuesta (octubre) | [`ui-style-sheet.png`](docs/img/ui-style-sheet.png) |
