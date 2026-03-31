# Deployment

Guides for deploying Terranova in different configurations.

| Guide | Description |
|---|---|
| [Docker](docker.md) | Deploy with Docker Compose (recommended) |
| [Storage Backends](storage-backends.md) | SQLite vs. Elasticsearch — how to choose |
| [Google Sheets Setup](google-sheets-setup.md) | Configure the Google Sheets datasource |
| [Keycloak OIDC](keycloak.md) | Set up OIDC authentication with Keycloak |

## Architecture summary

A production Terranova deployment consists of:

1. **The Terranova container** — runs Apache (serving the frontend static files) and Uvicorn (the API), managed by supervisord
2. **A storage backend** — either a SQLite file on disk or an Elasticsearch cluster
3. **Configuration files** — `/etc/terranova/settings.yml` and `/etc/terranova/settings.js`, mounted into the container

The Docker Compose setup handles all of this automatically.
