# Pipelines del repositorio web

Implementación de la sección 8.5 del reporte U2E4 (*Parámetros de configuración*).

| Workflow | Disparadores | Check | Qué hace |
|---|---|---|---|
| `ci-backend.yml` | PR a `dev`/`main`, push a `main`, manual, llamado por `cd-staging` | `backend-verify` | `./mvnw -B -ntp verify` con Temurin 21 y PostgreSQL 16 temporal en el runner |
| `contract.yml` | PR a `dev`/`main` | `backend-contract` | Redocly lint + `oasdiff breaking` contra la rama destino |
| `ci-frontend.yml` | PR a `dev`/`main`, push a `main`, manual, llamado por `cd-staging` | `web-verify` | Node 24: `npm ci`, `api:check` (opcional), lint, typecheck, Vitest, build |
| `cd-staging.yml` | push a `dev`, manual | — | CI backend + frontend → Flyway → Render → health check → Cypress de humo |
| `cd-production.yml` | tag `vX.Y.Z` en `main` | — | Valida que el tag esté en `main` → aprobación → mismo flujo contra producción |
| `reusable-deploy.yml` | `workflow_call` | — | Pasos de despliegue compartidos por los dos CD |

## Decisiones de implementación

- **Sin `paths:` en los eventos.** Cada workflow corre siempre y decide con `dorny/paths-filter` si verifica. Un job omitido cuenta como exitoso para la protección de ramas; con `paths:` el check quedaría pendiente en los PR que no tocan esa carpeta y la fusión se bloquearía.
- **`main` siempre verifica**, aunque el filtro diga que no hubo cambios (misma corrección que `fix/ci-main-siempre-compila` en el repositorio del juego).
- **Mientras `backend/` o `frontend/` no existan**, los checks se omiten con un aviso; no bloquean los PR de documentación.
- **El push a `dev` no dispara los CI por separado**: `cd-staging` los llama como workflows reutilizables y solo despliega si ambos pasan.
- **Vercel despliega la PWA desde Git** (`dev` → Preview, `main` → Production). Los CD solo migran, despliegan la API y corren las pruebas de humo.
- **Cambios incompatibles en el contrato**: se declaran con la etiqueta `breaking-change` en el PR; el reporte se publica pero el check no falla.

## Lo que espera cada carpeta

**backend/**: `mvnw` y `.mvn/` versionados; migraciones en `src/main/resources/db/migration` (`V1__initial_schema.sql`, `V2__initial_data.sql`); perfil `test` que use `DB_URL`, `DB_USER`, `DB_PASSWORD` y `JWT_SECRET`.

**frontend/**: `package-lock.json` versionado y estos scripts en `package.json`:

```json
{
  "scripts": {
    "lint": "eslint .",
    "typecheck": "tsc -b --noEmit",
    "test": "vitest run",
    "build": "tsc -b && vite build",
    "api:check": "openapi-typescript ../docs/api/openapi.yaml -o src/shared/api/schema.d.ts && git diff --exit-code src/shared/api/schema.d.ts"
  }
}
```

Las pruebas de humo viven en `frontend/cypress/e2e/smoke/` y leen `Cypress.config('baseUrl')` y `Cypress.env('API_URL')`.

## Configuración en GitHub (una sola vez)

1. **Rama `dev`** creada desde `main` y puesta como rama por defecto.
2. **Ambientes** en *Settings › Environments*: `staging` y `production`. En `production`, *Required reviewers*: Product Owner y Scrum Master; *Deployment branches and tags*: solo tags `v*.*.*`.
3. **Secretos por ambiente**: `DB_URL`, `DB_USER`, `DB_PASSWORD`, `DB_MIGRATION_USER`, `DB_MIGRATION_PASSWORD`, `JWT_SECRET`, `RENDER_DEPLOY_HOOK` y, opcional, `RENDER_API_KEY` (sin ella el workflow no puede esperar a que Render termine el build).
4. **Variables por ambiente**: `API_URL` (origen de Render, sin `/api`) y `WEB_URL` (dominio de Vercel).
5. **Etiqueta** `breaking-change` en *Issues › Labels*.
6. **Protección de `dev` y `main`** con los checks obligatorios `backend-verify`, `backend-contract` y `web-verify` (después de la primera ejecución de cada uno), igual que la Tabla 7 del reporte.
7. **Render**: *Auto-Deploy* desactivado y *Health Check Path* `/actuator/health`.
