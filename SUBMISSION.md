# Entrega · Propuesta de arquitectura e interfaz de la PWA

| | |
|---|---|
| Proyecto | *The Day I Made That Promise* |
| Equipo | Hex Studio: Jáuregui Iracheta Víctor Yahir · Medellín Salcedo Santiago · Molina Reza Omar Gael · Ramos Juárez Brenda Regina · Rodríguez González Emmanuel · Sidas Rodríguez Pedro Arturo |
| Institución | Universidad Tecnológica de Chihuahua |
| Fecha | Octubre de 2026 |
| Documento técnico | [README.md](README.md) |

## Actividad

> Diseñar la propuesta de arquitectura e interfaz para una Aplicación Web Progresiva (PWA), contemplando los siguientes componentes clave:
>
> - **Consumo de API:** Integración de endpoints remotos para la recuperación y renderizado dinámico de listas de datos.
> - **Estrategia PWA:** Implementación de Service Workers y un archivo de manifiesto para soporte offline y funcionamiento en segundo plano.
> - **Experiencia de Usuario (UI/UX):** Estructuración modular en JavaScript/CSS con diseño adaptativo.
>
> Enviar url del repositorio git, incluyendo README.md con la documentación de la propuesta y diagramas de la aplicación.

## Dónde se cubre cada requisito

| Requisito | Sección del README |
|---|---|
| Arquitectura | [§4 Arquitectura](README.md#4-arquitectura): contexto, despliegue, backend en capas `controller` / `service` / `repository` / `dto` / `model`, frontend modular |
| Interfaz (contratos entre componentes) | [§5 Interfaces](README.md#5-interfaces) |
| Consumo de API: endpoints remotos | [§7.2 Endpoints](README.md#72-endpoints), [§7.4 Cliente HTTP](README.md#74-cliente-http) y el contrato [`docs/api/openapi.yaml`](docs/api/openapi.yaml) |
| Consumo de API: recuperación y renderizado dinámico de listas | [§7.5 De la API a la pantalla](README.md#75-de-la-api-a-la-pantalla-listas-dinámicas) |
| Estrategia PWA: manifiesto | [§8.1 Manifiesto](README.md#81-manifiesto) |
| Estrategia PWA: Service Worker | [§8.2](README.md#82-qué-guarda-cada-caché) a [§8.4](README.md#84-ciclo-de-vida-y-actualización) |
| Estrategia PWA: soporte offline | [§8.5 Sin conexión](README.md#85-sin-conexión) |
| Estrategia PWA: segundo plano | [§8.6 Funcionamiento en segundo plano](README.md#86-funcionamiento-en-segundo-plano) |
| UI/UX: estructura modular en JavaScript/CSS | [§9.2 Estructura modular en JavaScript y CSS](README.md#92-estructura-modular-en-javascript-y-css) |
| UI/UX: diseño adaptativo | [§9.3 Diseño adaptativo](README.md#93-diseño-adaptativo) |
| Base de datos | [§6 Base de datos](README.md#6-base-de-datos) y scripts en [`docs/db/`](docs/db) |
| Diagramas | [`docs/img/`](docs/img) (imágenes) y [`docs/diagrams/`](docs/diagrams) (fuentes editables) |

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
| Hoja de estilo | [`ui-style-sheet.png`](docs/img/ui-style-sheet.png) |
