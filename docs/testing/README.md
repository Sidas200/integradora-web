# Laboratorio de pruebas

Proyecto integrador *The Day I Made That Promise*, equipo Hex Studio (IDGS101N).

Integrantes: Jáuregui Iracheta Víctor Yahir, Medellín Salcedo Santiago, Molina Reza Omar Gael, Ramos Juárez Brenda Regina, Rodríguez González Emmanuel y Sidas Rodríguez Pedro Arturo.

## 1. Objetivo

Validar la integración de la PWA con el backend en Spring Boot y la base de datos PostgreSQL:

- que las consultas `GET` se ejecuten y sus datos se rendericen en la interfaz;
- que los envíos `POST` se guarden con la estructura y las restricciones de la tabla;
- que una misma entidad se pueda **crear y consultar**: el jugador se registra (`POST /auth/register`) y la PWA lee su cuenta (`GET /account`);
- que la PWA siga funcionando sin conexión y envíe lo pendiente cuando vuelve la red;
- que la respuesta (códigos, tiempos, tamaño, headers) sea la que define el contrato `docs/api/openapi.yaml`.

Además del recorrido integral, el laboratorio incluye las pruebas automatizadas del código (sección 7): unitarias con JUnit 5 y Mockito en el backend (práctica de `findAll` y `create`), de integración contra PostgreSQL y unitarias con Vitest en el frontend.

## 2. Alcance

Se prueba la versión final: la parte pública (con caché sin conexión y cola en segundo plano, README principal, secciones 8.2 y 8.6) y el alta y la consulta de la cuenta del jugador.

| Funcionalidad | Endpoint | Tabla | Pantalla | Estrategia del Service Worker |
|---|---|---|---|---|
| Listado de noticias | `GET /api/v1/news?page=&size=` | `game.news_posts` | `/news` y sección de noticias de `/` | StaleWhileRevalidate, caché `public-api` |
| Detalle de noticia | `GET /api/v1/news/{slug}` | `game.news_posts` | `/news/:slug` | StaleWhileRevalidate, caché `public-api` |
| Catálogo de logros | `GET /api/v1/achievements` | `game.achievements` | sección de logros de `/` | StaleWhileRevalidate, caché `public-api` |
| Aviso de lanzamiento | `POST /api/v1/subscriptions` | `game.launch_subscriptions` | formulario de `/` | Cola de Background Sync en IndexedDB |
| Registro de jugador | `POST /api/v1/auth/register` | `game.players` (+ `settings`, `auth_sessions`) | `/register` | Siempre a la red (no se encola: necesita respuesta) |
| Cuenta del jugador | `GET /api/v1/account` | `game.players` | `/app` y `/app/account` | A la red; la copia queda en IndexedDB para el modo lectura (README §8.5) |

## 3. Entorno

```mermaid
flowchart LR
  subgraph Chrome
    UI[PWA React<br/>vite preview :4173] --> SW[Service Worker<br/>Workbox]
    SW --- CS[(Cache Storage<br/>precache + public-api)]
    SW --- IDB[(IndexedDB<br/>workbox-background-sync<br/>y caché del jugador)]
  end
  SW -->|/api, proxy de Vite| API[Spring Boot<br/>perfil local :8082]
  API -->|JDBC, HikariCP| DB[(PostgreSQL local<br/>base tdimp, esquema game)]
  PW[Playwright<br/>lab-evidence.mjs] -.-> UI
  PW -.->|casos API| API
```

| Componente | Versión y configuración |
|---|---|
| Base de datos | PostgreSQL local, base `tdimp`, esquema `game` creado por Flyway (V1 esquema, V2 datos iniciales, V3 catálogo del capítulo 1) |
| Backend | Spring Boot 4.1.1, Java 21, perfil `local`, HikariCP de 5 conexiones, puerto 8082 (`backend/.env`) |
| Frontend | React 19, Vite 8, vite-plugin-pwa (injectManifest), Workbox 7, TanStack Query 5 |
| Navegador | Google Chrome de escritorio (capturas manuales) y Chromium de Playwright (recorrido automático, con *reducir movimiento* para que las capturas de página completa salgan sin animaciones a medias) |

La PWA se sirve con `npm run preview` (build de producción, con Service Worker) y reenvía `/api` a la API con el proxy de Vite (`API_ORIGIN` en `frontend/.env.local`), igual que el rewrite de Vercel en producción.

**Trazas que se usan como evidencia**

- Backend: `RequestTraceFilter` escribe una línea al recibir cada petición (`-->`, con el tamaño del payload) y otra al responder (`<--`, con el código, tiempo total, número de consultas y tiempo en PostgreSQL, bytes de respuesta y heap de la JVM antes y después). Los repositorios registran cada consulta con sus filas y su tiempo (`BD SELECT ...`, `BD INSERT ... INSERT 0 1`). Las respuestas llevan los headers `X-Request-Id` y `Server-Timing`.
- Frontend: la consola muestra `TDIMP API` (petición, código, tiempo, tamaño), `TDIMP RENDER` (lo que se pintó) y `TDIMP PWA` / `[SW]` (Service Worker, caché y cola).

## 4. Datos del laboratorio

Scripts en `docs/testing/sql/` (pgAdmin o psql, sobre la base `tdimp`):

| Script | Uso |
|---|---|
| `01_limpieza.sql` | Borra las suscripciones, las noticias y los jugadores del laboratorio (`lab-*@tdimp.test`, con sus sesiones y configuración en cascada). Deja intactos los catálogos de Flyway. |
| `02_carga.sql` | Carga el estado inicial: las 9 noticias publicadas y el borrador de Hex Studio (las mismas de producción, `docs/db/news_hex_studio.sql`) y 2 suscripciones previas. Termina verificando los conteos (y los 6 logros) y **falla** si no cuadran. |
| `03_evidencias.sql` | Consultas para las capturas: A antes del envío, B después, C integridad, D plan de ejecución, E jugadores creados. |

## 5. Ejecución (PowerShell)

Se usan tres terminales y pgAdmin.

**Paso 1. Backend** (terminal 1). La primera vez crea el esquema con Flyway.

```powershell
cd backend
./mvnw spring-boot:run
```

**Paso 2. Datos** (pgAdmin, base `tdimp`, Query Tool). Ejecutar `01_limpieza.sql` y luego `02_carga.sql`; el mensaje debe decir *Estado inicial correcto*. Ejecutar el **bloque A** de `03_evidencias.sql` y tomar `db/db-01-antes.png`.

**Paso 3. PWA** (terminal 2).

```powershell
cd frontend
npm run build
npm run preview
```

**Paso 4. Recorrido automático** (terminal 3). Dura cerca de un minuto y medio y genera todo lo marcado como *auto* en `evidencias/README.md`.

```powershell
cd frontend
npm run lab:evidence
```

Debe terminar con `API 16/16 · PWA 9/9`. Si un caso falla, deja `evidencias/frontend/<caso>-ERROR.png` con la pantalla del momento.

> El registro de jugadores tiene un límite de 10 por IP cada hora (README §12.1). Cada corrida registra 3 (API-13, API-15 y PWA-09), así que se puede repetir unas tres veces por hora; después responde 429 hasta que pase la ventana o se reinicie la API.

**Paso 5. Capturas manuales en Chrome** (DevTools abierto antes de cargar la página, en `http://localhost:4173`). La primera carga instala el Service Worker; recarga una vez para que todas las peticiones pasen por él.

| Captura | Dónde | Qué debe verse |
|---|---|---|
| `devtools-01-console.png` | `/news`, pestaña **Console**, recargar | Líneas `TDIMP API → GET /api/v1/news`, `← 200 ... ms · KB`, `TDIMP RENDER NewsList renderizó 6 de 9` y los `[SW]`. |
| `devtools-02-network-get.png` | `/news`, **Network**, filtro `api`, recargar y abrir la petición `news?page=0&size=6` (la del engrane ⚙ es la que el Service Worker hizo a la red) | Columnas Status, Size y Time; en Headers: `200`, `Cache-Control: max-age=300, public`, `Server-Timing`, `X-Request-Id`. Opcional: pestaña Timing con la sección Server Timing. |
| `devtools-03-application-sw.png` | **Application › Service workers** | `sw.js` *activated and is running*. |
| `devtools-04-cache-storage.png` | **Application › Cache storage › public-api** | Las respuestas de `/api/v1/news` y `/api/v1/achievements` guardadas. |
| `devtools-05-network-post.png` | `/` (Inicio), enviar el formulario *Avísame del lanzamiento* con un correo nuevo; **Network › subscriptions › Payload** | El JSON enviado y el estado `202`. |
| `devtools-06-indexeddb-cola.png` | **Application › Service workers**, marcar **Offline**; enviar otro correo (aparece *Sin conexión: guardamos tu registro…*); abrir **IndexedDB › workbox-background-sync › requests** | Una petición en `subscription-queue`. |
| `devtools-07-sincronizado.png` | Desmarcar **Offline**; en **Service workers › Sync** escribir `workbox-background-sync:subscription-queue` y pulsar **Sync**; refrescar `requests` | La PWA dice *Volvió la conexión…* y la cola quedó vacía. |
| `devtools-08-network-registro.png` | Cerrar sesión si hay una abierta; `/register` con un correo `lab-manual-…@tdimp.test`; **Network**, filtro `api` | `POST auth/register` con `201` (en Payload la contraseña se ve: tápala o usa una de prueba) y después `GET account` con `200`. |

**Paso 6. Base después del envío** (pgAdmin). Ejecutar los **bloques B, C, D y E** de `03_evidencias.sql` y tomar `db-02-despues.png`, `db-03-integridad.png`, `db-04-explain.png` y `db-05-jugadores.png`.

**Paso 7. Log del backend.** Captura de la terminal 1 con las líneas `-->` / `<--` de un `POST /api/v1/subscriptions`, un `POST /api/v1/auth/register` y un `GET /api/v1/news` → `backend/backend-01-consola.png`. El archivo completo ya lo copió el paso 4 a `backend/tdimp-api.log`.

**Paso 8. Pruebas automatizadas** (terminal 3; el backend usa la base `tdimp_test`, así que pueden correr con la API encendida).

```powershell
cd backend;  ./mvnw verify 2>&1 | Tee-Object ../docs/testing/evidencias/backend/mvn-verify.txt; cd ..
cd frontend; npm run test:coverage 2>&1 | Tee-Object ../docs/testing/evidencias/frontend/npm-test.txt; cd ..
```

## 6. Casos de prueba

Cada comportamiento se verifica una vez, en la capa donde tiene sentido; las capturas manuales documentan los mismos flujos desde DevTools y pgAdmin.

### 6.1 Base de datos

| ID | Caso | Resultado esperado | Evidencia |
|---|---|---|---|
| DB-01 | Carga del estado inicial | `02_carga.sql` termina con *Estado inicial correcto*: 9 publicadas, 1 borrador, 2 suscripciones, 0 jugadores del laboratorio, 6 logros. | `db-01-antes.png` |
| DB-02 | Persistencia de los envíos | Aparecen los correos `lab-api-*`, `lab-online-*` y `lab-offline-*` con `id` y `created_at` generados por la base, en minúsculas y con 0 duplicados aunque la API recibió uno de ellos dos veces. | `db-02-despues.png` |
| DB-03 | Integridad | Estructura y restricciones de la tabla; los 6 intentos inválidos (mayúsculas, sin dominio, idioma, origen, nulo, duplicado) se rechazan con `CHECK`, `NOT NULL` o `UNIQUE` y su SQLSTATE. | `db-03-integridad.png` |
| DB-04 | Plan de la consulta del listado | `Index Scan using ix_news_posts_published`. | `db-04-explain.png` |
| DB-05 | Jugadores creados | 2 filas (`lab-user-api-*` y `lab-user-web-*`, más las que registres a mano), contraseña cifrada con BCrypt (`{bcrypt}$2a$…`), configuración por defecto y 1 sesión `WEB` cada una; el registro repetido de API-15 no creó otra fila. | `db-05-jugadores.png` |

### 6.2 API (directo a Spring Boot)

| ID | Petición | Resultado esperado |
|---|---|---|
| API-01 | `GET /news?page=0&size=6` | 200, 6 elementos, `totalElements = 9`, `Cache-Control: max-age=300, public` |
| API-02 | `GET /news?page=1&size=6` | 200, los 3 restantes |
| API-03 | `GET /news/diario-03-la-forja-de-kaede` | 200 con `contentMd` |
| API-04 | `GET /news/lo-que-viene-despues-del-capitulo-1` | 404 `problem+json` `NOT_FOUND`: un borrador no se publica |
| API-05 | `GET /news?size=51` | 400 `VALIDATION_FAILED` en `size` |
| API-06 | `GET /achievements` | 200, 6 logros, los ocultos sin descripción, `Cache-Control: max-age=3600, public` |
| API-07 | `POST /subscriptions` válido | 202 |
| API-08 | El mismo correo en mayúsculas | 202 sin fila nueva (se normaliza y `ON CONFLICT DO NOTHING`); se confirma en DB-02 |
| API-09 a API-12 | Correo inválido, sin consentimiento, idioma `fr`, JSON mal formado | 400 `problem+json` `VALIDATION_FAILED` con el campo; ninguna fila nueva |
| API-13 | `POST /auth/register` (cliente `WEB`) | 201 con `accessToken` Bearer; el refresh token llega en una cookie `HttpOnly` y no en el JSON |
| API-14 | `GET /account` con ese token | 200 con el mismo correo y nombre de jugador, `id` y `createdAt` generados por la base |
| API-15 | `POST /auth/register` con el mismo correo | 409 `problem+json` `EMAIL_IN_USE`; ninguna fila nueva (se confirma en DB-05) |
| API-16 | `GET /account` sin token | 401 `problem+json`: los datos del jugador solo se leen con sesión |
| LAT | 20 peticiones seguidas a cada `GET` público | Mín, p50, p95, máx y promedio; tiempo en Spring y en PostgreSQL según `Server-Timing` |
| ACT | Actuator al terminar | Salud de la API y la base, heap usado, conexiones del pool y peticiones atendidas por URI |

Evidencia: `backend/api-report.md`, `backend/trazas.md`, `backend/tdimp-api.log`.

### 6.3 PWA (Playwright sobre las páginas reales)

| ID | Caso | Resultado esperado | Evidencia |
|---|---|---|---|
| PWA-01 | Landing `/` | Se renderizan los 6 logros (ocultos con el texto *Se revela al desbloquearlo*) y las 3 noticias recientes; el Service Worker controla la página. | `ui-01-landing.png` |
| PWA-02 | Listado `/news` | 6 de 9; *Cargar más* pide `page=1` y muestra 9. Las respuestas quedan en `public-api`. | `ui-02-noticias.png`, `application-report.json` |
| PWA-03 | Detalle `/news/:slug` | Título, fecha, portada y Markdown de la noticia. | `ui-03-detalle.png` |
| PWA-04 | Formulario en línea | `POST` → 202 y mensaje *¡Listo!*. | `ui-04-registro-en-linea.png` |
| PWA-05 | Lectura sin conexión | Aviso *Sin conexión*; el listado y el detalle ya visitados salen de Cache Storage. | `ui-05-offline-noticias.png`, `ui-06-offline-detalle.png` |
| PWA-06 | Página no visitada sin conexión | Mensaje *No hay conexión con el servidor* y botón *Reintentar*, sin pantalla rota. | `ui-07-offline-sin-copia.png` |
| PWA-07 | Envío sin conexión | El Service Worker responde 202 con `X-Queued: 1` y guarda la petición en IndexedDB. | `ui-08-offline-en-cola.png`, `application-report.json` |
| PWA-08 | Regreso de la red | Background Sync reenvía la cola, queda vacía y la PWA avisa *Volvió la conexión*; el registro llega a la base (DB-02). | `ui-09-sincronizado.png`, `application-report.json` |
| PWA-09 | Registro y cuenta | El formulario de `/register` hace el `POST` (201), entra al panel `/app` con el nombre del jugador y `/app/account` muestra el correo y la fecha de alta leídos con `GET /account` (200). | `ui-10-cuenta-creada.png`, `ui-11-mi-cuenta.png` |

Además: `frontend/network.har` (tráfico completo de `/api`), `frontend/network-report.md` (status, si lo entregó el Service Worker, TTFB, total, bytes, payload y headers de cada petición) y `frontend/console.log` (consola de la página y del Service Worker). La contraseña del jugador de prueba se reemplaza por `***` en el reporte y en el HAR.

## 7. Pruebas automatizadas

Corren en cada PR (GitHub Actions, `ci-backend.yml` y `ci-frontend.yml`) y son check obligatorio para fusionar.

### 7.1 Backend: práctica de `findAll` y `create` (JUnit 5 + Mockito)

Guía *Pruebas unitarias en Spring Boot* (IDGS101). Las dos pruebas aíslan la capa `service`: el repositorio es un `@Mock` y el servicio real se crea con `@InjectMocks`, sin levantar Spring ni la base de datos.

| Operación | Clase de prueba | Servicio probado | Repositorio simulado | Qué valida |
|---|---|---|---|---|
| `findAll` | `AchievementServiceFindAllTest` | `AchievementServiceImpl.catalog()` | `AchievementReader.findAllOrdered()` | El repositorio devuelve 2 logros y el servicio regresa 2 `AchievementDto`. |
| `create` | `SubscriptionServiceCreateTest` | `SubscriptionServiceImpl.subscribe()` | `SubscriptionWriter.insertIfAbsent()` | Con `ArgumentCaptor` se revisa el objeto que llegó al repositorio: correo, idioma, origen y fecha del reloj fijo. |

Usan `@ExtendWith(MockitoExtension.class)`, `@Mock`, `@InjectMocks`, `@Spy`, `@DisplayName`, `when(...).thenReturn(...)`, `verify(...)` y `assertThat` de AssertJ; la dependencia es `spring-boot-starter-test` (scope `test`). Detalle, comandos y capturas en [`backend/README.md`](../../backend/README.md#práctica-pruebas-unitarias-de-findall-y-create); evidencias en `evidencias/unitarias/`.

```powershell
cd backend
./mvnw test "-Dtest=AchievementServiceFindAllTest,SubscriptionServiceCreateTest"
```

Resultado esperado: `Tests run: 2, Failures: 0, Errors: 0, Skipped: 0` y `BUILD SUCCESS`.

### 7.2 Backend: resto de la suite

| Tipo | Clases | Qué cubren |
|---|---|---|
| Unitarias de servicios | `AuthServiceImplTest`, `AccountServiceImplTest`, `SaveServiceImplTest`, `AchievementServiceImplTest`, `NewsServiceImplTest`, `SubscriptionServiceImplTest`, `SaveMapperTest`, `HmacTokenIssuerTest`, `InMemoryRateLimiterTest`, `DeviceNamesTest` | Reglas de negocio con Mockito y reloj fijo: registro y login, rotación de sesiones, guardado con control de versión, límites de intentos, firma de tokens. |
| Controladores | `NewsControllerTest`, `AchievementControllerTest`, `ApiExceptionHandlerTest` | `@WebMvcTest`: códigos, headers de caché y errores `problem+json`. |
| Integración | `AuthApiIntegrationTest`, `AccountApiIntegrationTest`, `AccountDataIntegrationTest`, `SaveApiIntegrationTest`, `PublicApiIntegrationTest`, `RateLimitIntegrationTest`, `ApplicationIntegrationTest` | `@SpringBootTest` + MockMvc contra PostgreSQL real (`tdimp_test`); cada prueba se deshace con `@Transactional`. |
| Arquitectura | `ArchitectureTest` (ArchUnit) | Las capas `controller → service → repository` y que ningún paquete se salte una capa. |

`./mvnw verify` corre todo y genera la cobertura de JaCoCo en `backend/target/site/jacoco/index.html`. Evidencia: `evidencias/backend/mvn-verify.txt`.

### 7.3 Frontend (Vitest + MSW)

293 pruebas en 35 archivos con la API simulada por MSW (las mismas respuestas del contrato). Cobertura de la última corrida: **94 % de líneas, 91 % de sentencias y 88 % de ramas**.

| Grupo | Qué cubren |
|---|---|
| Pantallas | Landing, noticias (paginación, detalle, borrador, error), registro e inicio de sesión, panel del jugador, partidas, historial, logros, cuenta (perfil, configuración, seguridad, eliminar), 404. |
| PWA | Reglas del Service Worker (qué se cachea, qué se encola, reenvío de la cola), registro del SW, aviso de actualización, banner sin conexión, instalación, manifiesto (atajos y capturas), persistencia en IndexedDB por jugador, modo lectura. |
| Sesión y API | `authMiddleware` (refresh y reintento), sesión en memoria, esquemas zod, política de reintentos, claves de las consultas. |
| Accesibilidad y seguridad | axe-core en las rutas públicas y en el panel, contraste de los tokens de color en tema claro y oscuro, movimiento reducido, CSP igual en Vercel y nginx. |

```powershell
cd frontend
npm run test:coverage
```

Evidencia: `evidencias/frontend/npm-test.txt` (salida completa con la lista de pruebas y el resumen de cobertura).

## 8. Evidencias

Índice y checklist en [`evidencias/README.md`](evidencias/README.md). El resultado de la última corrida automática está en [`evidencias/resumen.md`](evidencias/resumen.md).

## 9. Observaciones

- En la primera visita la PWA consulta la API antes de que el Service Worker controle la página, así que esa respuesta no se guarda; desde la recarga todas las peticiones a `/api` pasan por él. Por eso el recorrido y las capturas recargan una vez.
- Con el Service Worker activo cada petición aparece dos veces en Network: la que recibe la página (servida por el Service Worker) y la que el Service Worker hace a la red (con ⚙). La latencia real del servidor es la segunda; el tiempo que pasa en Spring y en PostgreSQL lo da `Server-Timing`.
- `public-api` usa StaleWhileRevalidate: muestra la copia guardada al instante y la actualiza en segundo plano. Sin conexión solo están disponibles las páginas que ya se visitaron; las demás muestran el estado de error con *Reintentar*.
- Background Sync existe en navegadores Chromium. En Firefox y Safari la cola se envía cuando el Service Worker vuelve a arrancar.
- `consented_at` guarda la hora en que la API recibe la petición; en un registro que estuvo en cola es la hora del reenvío.
- El registro de jugadores no se encola sin conexión: necesita la respuesta del servidor (token y cookie) para iniciar la sesión, así que sin red el formulario muestra el error y no se envía nada.
- En Playwright, `context.setOffline()` no corta las peticiones del Service Worker. El script se conecta al Service Worker por CDP y las hace fallar con `InternetDisconnected`, y dispara el evento `sync` para no esperar a Chrome.
- Las capturas automáticas recorren la página completa antes de tomarla, para que carguen las imágenes diferidas (`loading="lazy"`), y usan *reducir movimiento*, así ninguna sección queda a media animación.
