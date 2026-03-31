# Project Structure

An overview of the repository layout.

```
terranova/
├── .github/
│   └── workflows/
│       └── docs.yml              # GitHub Actions: deploy documentation to GitHub Pages
├── config/
│   ├── httpd.conf                # Apache config (used inside Docker)
│   ├── supervisord.conf          # supervisord config (manages Apache + Uvicorn in Docker)
│   └── settings.js              # Default frontend settings (overwritten by volume mount)
├── docs/                         # Documentation source (MkDocs)
│   ├── getting-started/
│   ├── concepts/
│   ├── user-guide/
│   ├── api/
│   ├── deployment/
│   └── contributing/
├── etc/
│   └── terranova/
│       ├── settings.yml          # Default backend config (copy to /etc/terranova/)
│       └── settings.js           # Default frontend config (copy to /etc/terranova/)
├── terranova/                    # Main Python package
│   ├── api/
│   │   ├── routers/              # FastAPI route handlers
│   │   │   ├── basic_auth.py     # User management (basic auth)
│   │   │   ├── datasets.py       # Dataset CRUD
│   │   │   ├── datasources.py    # Datasource metadata
│   │   │   ├── maps.py           # Map CRUD
│   │   │   ├── output.py         # Map/dataset rendering
│   │   │   ├── templates.py      # Node template CRUD
│   │   │   ├── topologies.py     # Raw topology storage
│   │   │   └── userdata.py       # Per-user favorites/recents
│   │   └── __init__.py           # FastAPI app factory
│   ├── backends/
│   │   ├── auth/
│   │   │   ├── basic.py          # Basic auth implementation
│   │   │   └── keycloak.py       # Keycloak OIDC implementation
│   │   ├── elasticsearch/        # Elasticsearch storage backend
│   │   ├── sqlite/               # SQLite storage backend
│   │   ├── datasources.py        # DatasourceRegistry (plugin discovery)
│   │   └── storage.py            # Storage backend selector
│   ├── datasources/
│   │   └── google_sheets/        # Google Sheets datasource plugin
│   ├── frontend/                 # React/TypeScript frontend
│   │   ├── src/
│   │   │   ├── components/       # React components
│   │   │   ├── context/          # React context providers
│   │   │   ├── pages/            # Page-level components
│   │   │   └── App.tsx           # Router and top-level layout
│   │   ├── static/               # Static assets (settings.js loaded at runtime)
│   │   ├── dist/                 # Production build output (git-ignored)
│   │   ├── dist-test/            # Test build output (git-ignored)
│   │   └── vite.config.ts        # Vite config
│   ├── output/
│   │   └── svg.py                # SVG rendering logic
│   ├── abstract_models.py        # Abstract base classes
│   ├── models.py                 # Pydantic models (Map, Dataset, Template, etc.)
│   └── settings.py               # Config file parsing and global settings
├── tests/
│   ├── conftest.py               # Shared test fixtures
│   ├── frontend/                 # Playwright frontend tests
│   └── ...                       # API test suites
├── compose.yaml                  # Docker Compose: terranova + elasticsearch
├── Dockerfile                    # Terranova Docker image
├── Makefile                      # Development task runner
├── mkdocs.yml                    # Documentation site config
├── requirements.in               # Runtime Python dependencies (source)
├── requirements.txt              # Pinned runtime dependencies (generated)
├── requirements-dev.in           # Dev/test Python dependencies (source)
├── requirements-dev.txt          # Pinned dev dependencies (generated)
├── requirements-docs.txt         # Documentation dependencies
└── setup.py                      # Python package setup
```

## Key conventions

- **Python dependencies** are managed with pip-tools. Edit `.in` files, run `make compile-requirements`, commit all four files.
- **Frontend dependencies** use pnpm. Lockfile (`pnpm-lock.yaml`) must be committed.
- **Config files** are never committed to the repo (`.gitignore` excludes `config.yml`). Use the defaults in `etc/terranova/` as templates.
- **Build outputs** (`dist/`, `dist-test/`, `site/`, `.venv/`, `node_modules/`) are git-ignored.
