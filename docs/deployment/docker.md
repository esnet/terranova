# Docker Deployment

Terranova is distributed as a pre-built Docker image on the GitHub Container Registry. No local build is required.

## Prerequisites

- [Docker Engine](https://docs.docker.com/engine/install/) 20.10+
- [Docker Compose](https://docs.docker.com/compose/install/) v2

## Default setup (SQLite, single container)

The default configuration uses SQLite for storage — no external services needed.

```yaml title="compose.yaml"
services:
    terranova:
        image: ghcr.io/esnet/terranova:latest
        ports:
            - 9999:80
        volumes:
            - terranova-data:/data
        environment:
            TERRANOVA_CORS_ORIGINS: "http://localhost:9999"

volumes:
    terranova-data:
```

Start with:

```sh
docker compose up -d
```

Open `http://localhost:9999`. Log in with `admin` / `admin`.

All data (maps, datasets, templates, credentials) is persisted in the `terranova-data` named volume mounted at `/data`.

## Default credentials

| Username | Password | Role |
|----------|----------|------|
| `admin`  | `admin`  | Administrator |

Change the admin password in **Settings → User Management** after first login.

## Environment variables

| Variable | Description |
|----------|-------------|
| `TERRANOVA_CORS_ORIGINS` | Comma-separated list of allowed CORS origins, e.g. `http://myserver.example.com:9999`. Required when the app is accessed from a different host or port than `localhost:9999`. |
| `TERRANOVA_ENCRYPTION_KEY` | AES-256 encryption key for stored Google Sheets credentials. Auto-generated and persisted to `/data/.encryption_key` on first boot. Override to pre-set the key. |
| `TERRANOVA_CSS_*` | CSS custom property overrides for theming. See [Theming](#runtime-theming) below. |

## Runtime theming

Override CSS variables at runtime without rebuilding the image by setting `TERRANOVA_CSS_*` environment variables.

The variable names map to `--esnet-*` CSS custom properties:

```yaml
environment:
    TERRANOVA_CSS_COLOR_CORE_BLUE_700: "#1a5fa8"
    TERRANOVA_CSS_COLOR_BRAND_PRIMARY: "#ff6600"
```

This writes a `:root {}` CSS override file served at `/static/custom-theme.css`. Only Packets UI component styles (`var(--esnet-*)`) respond to these overrides; Tailwind utility classes are compiled at build time and cannot be changed at runtime.

## Using Elasticsearch

For Elasticsearch-backed storage, use the override compose file:

```sh
docker compose -f compose.yaml -f compose.elasticsearch.yml up -d
```

The `compose.elasticsearch.yml` file adds an Elasticsearch service and configures the health check. Edit it to update credentials for your deployment.

See [Storage Backends](storage-backends.md) for guidance on when each backend is appropriate.

## Custom configuration

To override the built-in `settings.yml`, bind-mount your own config file:

```yaml
volumes:
    - ./my-settings.yml:/etc/terranova/settings.yml
    - terranova-data:/data
```

See [Configuration](../getting-started/configuration.md) for a full reference.

## What's inside the container

The Terranova Docker image runs:

- **Apache** — serves the pre-built frontend and proxies `/api/v1/` to Uvicorn
- **Uvicorn** — serves the FastAPI backend API on a Unix socket
- **supervisord** — manages both processes and the data cache cycle
