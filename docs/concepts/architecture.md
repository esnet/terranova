# Architecture

Terranova is a web application with three main layers: a React frontend, a FastAPI backend, and a pluggable storage/datasource layer.

## Component overview

```
┌─────────────────────────────────────────────┐
│                   Browser                    │
│                                              │
│   React + TypeScript (Vite, React Router)    │
│   ┌────────────┐  ┌──────────┐  ┌────────┐  │
│   │ Map Editor │  │ Dataset  │  │ Node   │  │
│   │            │  │ Editor   │  │ Tmpl   │  │
│   └────────────┘  └──────────┘  └────────┘  │
└────────────────────┬────────────────────────┘
                     │ REST API (HTTP/JSON)
┌────────────────────▼────────────────────────┐
│              FastAPI Backend                 │
│                                             │
│  Routers: maps, datasets, templates,        │
│           output, datasources, auth,        │
│           userdata, topologies              │
└──────────┬──────────────────┬───────────────┘
           │                  │
    ┌──────▼──────┐    ┌──────▼────────────┐
    │   Storage   │    │   Datasources     │
    │             │    │                   │
    │ SQLite  or  │    │ Google Sheets     │
    │ Elasticsearch    │ (+ other plugins) │
    └─────────────┘    └───────────────────┘
```

## Frontend

The frontend is a single-page application built with React, TypeScript, and Vite. It communicates exclusively with the backend REST API.

Key pages:

- **Map Creator / Map Editor** — create and edit maps, configure layers, set overrides
- **Dataset Creator / Dataset Editor** — define queries, preview topology data in logical, geographic, or table views
- **Node Template Editor** — create and edit custom SVG node shapes
- **Dataset Library / Map Library** — browse all saved resources

The frontend is built into static files (`terranova/frontend/dist/`) and served by Apache in the Docker image. In development, it runs as a Vite dev server.

## Backend

The backend is a Python [FastAPI](https://fastapi.tiangolo.com/) application served by Uvicorn. It exposes a versioned REST API under `/api/v1/`.

API routers:

| Router | Path prefix | Responsibility |
|---|---|---|
| `maps.py` | `/api/v1/map` | CRUD for maps |
| `datasets.py` | `/api/v1/dataset` | CRUD for datasets |
| `templates.py` | `/api/v1/template` | CRUD for node templates |
| `output.py` | `/api/v1/output` | Map rendering (SVG, JSON topology) |
| `datasources.py` | `/api/v1/datasource` | Query available datasource endpoints |
| `basic_auth.py` | `/api/v1/user` | User management (basic auth mode) |
| `userdata.py` | `/api/v1/userdata` | Per-user favorites and recents |
| `topologies.py` | `/api/v1/topology` | Raw topology JSON storage |

FastAPI auto-generates interactive API documentation at `/docs` (Swagger UI) and `/redoc` on any running instance.

## Storage backends

Terranova ships two interchangeable storage backends, selected via `settings.yml`:

**SQLite** (`storage.backend: sqlite`)

- File-based, zero dependencies, ideal for development and small deployments
- All data stored in a single `.db` file
- Default for new installs

**Elasticsearch** (`storage.backend: elasticsearch`)

- Distributed, scalable, suitable for production
- Requires a running Elasticsearch cluster
- Supports wildcard read indices for multi-index query patterns
- Used by the Docker Compose setup

Both backends implement an identical interface — switching between them requires only a config change.

## Datasources

Datasources are plugins that fetch network topology data from external systems. They are queried when building a dataset.

The built-in datasource is **Google Sheets**, which reads circuit/topology data from spreadsheets shared with a service account.

Datasource results are cached locally (in a SQLite file per datasource) to reduce API calls to the upstream system.

## Authentication

Two authentication backends are supported:

- **Basic auth** — username/password, managed via the Terranova API. Suitable for simple deployments.
- **Keycloak OIDC** — delegates authentication to a Keycloak realm. Suitable for production deployments with existing identity infrastructure.

See [Authentication](authentication.md) for details.

## Data model

The four primary resource types stored in Terranova:

| Resource | ID field | Description |
|---|---|---|
| `Map` | `mapId` | A named, versioned map with configuration and overrides |
| `Dataset` | `datasetId` | A named, versioned dataset with a query definition |
| `Template` | `templateId` | A named, versioned SVG node template |
| `UserData` | `username` | Per-user favorites and recently-edited resource lists |

All resources use a 7-character alphanumeric ID and support multiple versions. The API returns the `latest` version by default.
