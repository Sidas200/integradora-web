# tdimp-api

API del proyecto en Spring Boot 4.1 con Java 21. Sigue la arquitectura por capas del README principal: `controller`, `service`, `repository`, `dto` y `model`. Se conecta a la base de datos de Supabase (esquema `game`).

## Endpoints

| Método y ruta | Clases |
|---|---|
| `GET /api/v1/news?page=&size=` | `NewsController`, `NewsService`, `NewsReader` |
| `GET /api/v1/news/{slug}` | `NewsController`, `NewsService`, `NewsReader` |
| `POST /api/v1/subscriptions` | `SubscriptionController`, `SubscriptionService`, `SubscriptionWriter` |
| `GET /actuator/health` | Actuator |
| `GET /actuator/metrics/**` | Actuator, solo con el perfil `local` |

## Variables de entorno

| Variable | Valor |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `local` |
| `DB_URL` | `jdbc:postgresql://<host del session pooler>:5432/postgres?sslmode=require` |
| `DB_USER` | `postgres.bkzsbwuksmqwroudvljz` |
| `DB_PASSWORD` | Contraseña de la base de datos |

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
