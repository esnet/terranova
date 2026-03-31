# Development Setup

This guide covers setting up a full development environment for working on Terranova's backend API and frontend.

## Prerequisites

- Python 3.11+
- Node.js 18+
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- graphviz (`brew install graphviz` on macOS, `apt-get install graphviz graphviz-dev` on Ubuntu)
- Docker + Docker Compose (for running Elasticsearch)

## Initial setup

```sh
git clone git@github.com:esnet/terranova.git
cd terranova

# Copy default config
sudo cp -R etc/terranova /etc/

# Install all dependencies
make install
```

`make install` creates a Python virtual environment at `.venv/`, installs all runtime and dev dependencies, and installs the frontend Node modules.

## Running in development mode

```sh
# Start Elasticsearch (if using the Elasticsearch backend)
docker compose up elasticsearch -d

# Start the API and frontend dev server together
make run
```

Or separately:

```sh
make run_api         # FastAPI on http://localhost:8000
make run_frontend    # Vite dev server on http://localhost:5173
```

The Vite dev server proxies API calls to `http://localhost:8000` automatically.

## Development config

The default `settings.yml` at `/etc/terranova/settings.yml` uses basic auth and SQLite, which requires no external services. For development this is simplest:

```yaml
storage:
  backend: sqlite
  sqlite_path: ./terranova.db

auth:
  backend: basic

basic_auth:
  db_filename: /tmp/basic_auth.sqlite
```

## Creating a dev user

With basic auth, create your first user via the API:

```sh
# Wait for the API to start, then:
curl -X POST http://localhost:8000/api/v1/user \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "name": "Admin",
    "password": "admin",
    "scope": ["terranova:maps:read", "terranova:maps:write", "terranova:maps:publish", "terranova:admin"]
  }'
```

!!! note
    The first user creation doesn't require authentication (the database is empty). Subsequent user creation requires the `admin` scope.

## Frontend development

The frontend is a React + TypeScript application using Vite and pnpm:

```sh
cd terranova/frontend

pnpm install      # install Node dependencies
pnpm run dev      # start dev server (also available via make run_frontend)
pnpm run build    # production build
pnpm run build-test   # test build (minification disabled)
```

## Backend development

The backend is a Python FastAPI application:

```sh
# Activate the venv
source .venv/bin/activate

# Run with auto-reload
uvicorn terranova.api:app --reload

# Or via make
make run_api
```

FastAPI's interactive API docs are at `http://localhost:8000/docs`.

## Installing pre-commit hooks

```sh
source .venv/bin/activate
pre-commit install
```

See [Code Style](code-style.md) for details on what the hooks enforce.
