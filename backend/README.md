# tdimp-api

API del proyecto en Spring Boot 4.1 con Java 21. Sigue la arquitectura por capas del README principal: `controller`, `service`, `repository`, `dto` y `model`. Se conecta a la base de datos de Supabase (esquema `game`).

## Endpoints

| Método y ruta | Clases |
|---|---|
| `GET /api/v1/news?page=&size=` | `NewsController`, `NewsService`, `NewsReader` |
| `GET /api/v1/news/{slug}` | `NewsController`, `NewsService`, `NewsReader` |
| `POST /api/v1/subscriptions` | `SubscriptionController`, `SubscriptionService`, `SubscriptionWriter` |
| `POST /api/v1/auth/register` · `/login` · `/refresh` · `/logout` | `AuthController`, `AuthService`, `PlayerRepository`, `AuthSessionRepository`, `TokenIssuer`, `RefreshChannel` |
| `GET /api/v1/account` · `GET`/`PUT /account/settings` | `AccountController`, `AccountService`, `SettingsRepository`, `HistoryReader` |
| `GET /api/v1/account/sessions?slot=` · `GET /account/history?type=` | `AccountController`, `AccountService`, `HistoryReader` |
| `GET /api/v1/account/achievements` · `PUT /account/achievements/{id}` | `AccountController`, `AchievementService`, `AchievementRepository` |
| `GET /api/v1/account/saves` · `GET /account/saves/{slot}` | `SaveController`, `SaveService`, `SaveRepository` |
| `GET`/`PUT /api/v1/account/saves/{slot}/data` | `SaveController`, `SaveService`, `SaveRepository`, `CatalogReader` |
| `POST /api/v1/account/saves/{slot}/sessions` · `/events` | `SaveController`, `SaveService`, `TelemetryWriter` |
| `GET /api/v1/achievements` | `AchievementController`, `AchievementService`, `CatalogReader` |
| `GET /actuator/health` | Actuator |
| `GET /actuator/metrics/**` | Actuator, solo con el perfil `local` |

Las rutas `/api/v1/account/**` exigen `Authorization: Bearer <access token>` (`BearerAuthInterceptor`); las demás son públicas. El access token es un JWT HS256 de 15 minutos firmado con `JWT_SECRET`. El refresh token dura 30 días, rota en cada uso y en la base solo se guarda su SHA-256. Viaja en la cookie `tdimp_rt` para `WEB` y en el JSON para `UNITY_PC` y `MOBILE`.

## Variables de entorno

| Variable | Valor |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `local` |
| `DB_URL` | `jdbc:postgresql://<host del session pooler>:5432/postgres?sslmode=require` |
| `DB_USER` | `postgres.<project-ref>` |
| `DB_PASSWORD` | Contraseña de la base de datos |
| `JWT_SECRET` | Cadena aleatoria de al menos 64 caracteres (obligatoria, no tiene valor por defecto) |

El host se copia de Supabase, en Connect, opción Session pooler. El archivo `.env` no se sube al repositorio.

## Ejecución

Git Bash:

```bash
cd backend
set -a; source .env; set +a
mvn spring-boot:run
```

PowerShell:

```powershell
cd backend
Get-Content .env | ForEach-Object { $k, $v = $_ -split '=', 2; Set-Item "env:$k" $v }
mvn spring-boot:run
```

En IntelliJ se abre `backend/pom.xml` y las variables se agregan en la configuración de ejecución.

El Maven Wrapper (`mvnw`, `mvnw.cmd` y `.mvn/`) está versionado y fija Maven 3.9.11; el pipeline de CI lo usa. También se puede ejecutar con `./mvnw spring-boot:run` (Git Bash) o `.\mvnw.cmd spring-boot:run` (PowerShell) sin instalar Maven.

## Logs

Con el perfil `local` los logs se escriben en consola y en `logs/tdimp-api.log`. Por cada petición a `/api` se registra la entrada, las consultas a la base con filas afectadas y tiempo, y la salida con código de respuesta, tiempo total, tiempo en base de datos, tamaño de la respuesta y memoria heap.
