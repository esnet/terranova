# Docker Deployment

The recommended way to deploy Terranova is with Docker Compose, which starts the application and an Elasticsearch cluster together.

## Prerequisites

- [Docker Engine](https://docs.docker.com/engine/install/) 20.10+
- [Docker Compose](https://docs.docker.com/compose/install/) v2

## Setup

### 1. Configure the settings files

Copy the default configuration:

```sh
sudo cp -R etc/terranova /etc/
```

Edit `/etc/terranova/settings.yml` as needed. See [Configuration](../getting-started/configuration.md) for a full reference.

Edit `/etc/terranova/settings.js` to set `API_URL` to the public URL of your deployment:

```js
export const API_URL = `http://your-server/api/v1/`;
```

### 2. Build and start

```sh
docker compose build
docker compose up -d
```

This starts:

- **terranova** — the application on port `9999` (maps to Apache on port `80` inside the container)
- **elasticsearch** — Elasticsearch on port `9200`

### 3. Verify

```sh
# Check both containers are running
docker compose ps

# Check the API is responding
curl http://localhost:9999/api/v1/
```

Open `http://localhost:9999` in your browser to access the Terranova UI.

## What's inside the container

The Terranova Docker image (`python:3.11-alpine`) runs:

- **Apache** — serves the built frontend static files from `/terranova/static/`
- **Uvicorn** — serves the FastAPI backend API
- **supervisord** — manages both processes

The image bundles the pre-built frontend. To rebuild the frontend:

```sh
docker compose build --no-cache
```

## Volume mounts

The `compose.yaml` mounts two paths from the host:

| Host path | Container path | Purpose |
|---|---|---|
| `/etc/terranova/` | `/etc/terranova/` | Backend config (`settings.yml`, credentials) |
| `/etc/terranova/settings.js` | `/terranova/static/settings.js` | Frontend config |

!!! warning
    The `settings.js` mount overwrites the default frontend config baked into the image. Always provide a configured `settings.js` before starting the container.

## Elasticsearch configuration

The bundled Elasticsearch service uses default settings suitable for a single-node development or small production deployment:

- Memory: 750 MB heap, 4 GB container limit
- Security: disabled (`xpack.security.enabled: false`)
- Discovery: single-node

For production, consider:

- Enabling Elasticsearch security (TLS + authentication)
- Increasing memory limits
- Using a managed Elasticsearch service instead of a sidecar container

## Using SQLite instead of Elasticsearch

If you want to run Terranova without Elasticsearch, configure `storage.backend: sqlite` in `settings.yml` and start only the `terranova` service:

```sh
docker compose up terranova
```

See [Storage Backends](storage-backends.md) for guidance on when to use each backend.
