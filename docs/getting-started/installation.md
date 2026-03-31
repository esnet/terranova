# Installation

This guide covers a full local development setup. If you just want to run Terranova, see the [Quickstart](quickstart.md) instead.

## Prerequisites

- Python 3.11+
- Node.js 18+ and [pnpm](https://pnpm.io/)
- [graphviz](https://graphviz.org/download/) (required by `pygraphviz`)

### Installing graphviz

=== "macOS"
    ```sh
    brew install graphviz
    ```

=== "Ubuntu/Debian"
    ```sh
    apt-get install graphviz graphviz-dev
    ```

=== "RHEL/Fedora"
    ```sh
    dnf install graphviz graphviz-devel
    ```

### Optional: Elasticsearch

Required only if using the Elasticsearch storage backend. The easiest approach during development is to run Elasticsearch via Docker:

```sh
# Start only the Elasticsearch service from compose.yaml
docker compose up elasticsearch
```

## 1. Clone the repository

```sh
git clone git@github.com:esnet/terranova.git
cd terranova
```

## 2. Copy the default configuration

```sh
sudo cp -R etc/terranova /etc/
```

See [Configuration](configuration.md) for a full reference of all settings.

## 3. Install dependencies

```sh
make install
```

This creates a Python virtual environment, installs all runtime and development dependencies, and installs the Node modules for the frontend.

## 4. Run the application

Start the API and frontend dev server together:

```sh
make run
```

Or run them in separate shells:

```sh
make run_api       # FastAPI backend on http://localhost:8000
make run_frontend  # Vite dev server on http://localhost:5173
```

The frontend dev server proxies API calls to the backend automatically.

## Makefile reference

| Target | Description |
|---|---|
| `make install` | Install all Python and Node dependencies |
| `make run` | Start API + frontend side-by-side (Ctrl+C stops both) |
| `make run_api` | Start the Python API only |
| `make run_frontend` | Start the Vite dev server only |
| `make build` | Build the frontend for production |
| `make test` | Run all tests (frontend and backend) |
| `make api-test` | Run Python API tests only |
| `make frontend-test` | Run Playwright frontend tests only |
| `make frontend-test-headed` | Run Playwright tests with a visible browser |
| `make fetch` | Populate the SQLite database from configured datasources |
| `make compile-requirements` | Regenerate pip lockfiles from `.in` source files |
| `make clean` | Remove the Python venv and Node modules |
| `make docs` | Build the documentation site |
| `make serve-docs` | Serve the documentation site locally |

## Managing Python dependencies

Python dependencies are managed with [pip-tools](https://pip-tools.readthedocs.io/). The source of truth is two short files:

- `requirements.in` — direct runtime dependencies
- `requirements-dev.in` — additional development and test dependencies

These compile into fully-pinned lockfiles (`requirements.txt`, `requirements-dev.txt`) which `make install` uses. Do not edit the lockfiles directly.

To add or update a dependency:

```sh
# 1. Edit requirements.in or requirements-dev.in
make compile-requirements   # regenerates the lockfiles
make install                # installs the updated packages
git add requirements*.in requirements*.txt
git commit
```
