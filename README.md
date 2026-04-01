# Terranova

[![CI](https://github.com/esnet/terranova/actions/workflows/ci.yml/badge.svg)](https://github.com/esnet/terranova/actions/workflows/ci.yml)
[![Docker](https://github.com/esnet/terranova/actions/workflows/docker.yml/badge.svg)](https://github.com/esnet/terranova/actions/workflows/docker.yml)

An app for building and editing network topology maps.

- [Getting Started](#getting-started)
- [Development](#development)

## Getting Started

Terranova is distributed as a pre-built Docker image. No clone or build required.

### 1. Create a compose file

```yaml
# compose.yaml
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

### 2. Start

```sh
docker compose up -d
```

Open `http://localhost:9999` and log in with `admin` / `admin`.

### 3. Connect your data

Terranova displays topology data from Google Sheets. After logging in:

1. Go to **Settings**
2. Click **Add Google Sheets Datasource**
3. Paste your Google service account JSON key

See the [Google Sheets Setup guide](https://esnet.github.io/terranova/deployment/google-sheets-setup/) for instructions on creating a service account.

## Development

To develop Terranova, you'll still need to do all of the above, then follow the below instructions.

### Prerequisites

Various libraries and packages used in Terranova have other dependencies that may need to be installed. These specifically include:

- [`pygraphviz`](https://pygraphviz.github.io/), needing [`graphviz`](https://pygraphviz.github.io/documentation/stable/install.html). If you are on a Mac, you make encounter an error failing to build the pygraphviz wheel. To resolve this, you'll need to comment out pygraphviz in requirements.in, allowing all other packages to install, then follow these [instructions](https://pygraphviz.github.io/documentation/stable/install.html#macos) to resolve.

- [`Elasticsearch`](https://www.elastic.co/docs/deploy-manage/deploy/self-managed/local-development-installation-quickstart). TODO: Add elasticsearch installation and setup instructions. In the meantime, you comment out the `terranova` service in the Docker compose file, and run `docker compose up` to emulate. 

Terranova also uses Python 3 (3.11 is specified in the Dockerfile) and Node.js.

### Make

Once the above is completed, all further environment installations and development processes can be done from the Makefile. The Makefile encapsulates all commands needed to run any part of the project.

Install all dependencies (run once after cloning, or after pulling changes that update the lockfiles):
```sh
make install
```

Start Elasticsearch, the Python API, and the frontend dev server together (Ctrl+C stops all):
```sh
docker compose up       # start Elasticsearch in a separate shell (see prerequisites)
make run                # start API and frontend side-by-side
```

Or run them individually in separate shells:
```sh
make run_api            # Python API only
make run_frontend       # Node frontend dev server only
```

Additional useful Makefile targets:
- `make test`: Run all tests (frontend and backend).
- `make frontend-test`: Run Playwright frontend tests only.
- `make frontend-test-headed`: Run Playwright tests with a visible browser (useful for debugging).
- `make api-test`: Run Python API tests only.
- `make build`: Produce a production frontend build in `terranova/frontend/dist`.
- `make clean`: Remove the Python virtual environment and all Node modules.

### Managing Python Dependencies

Python dependencies are managed with [pip-tools](https://pip-tools.readthedocs.io/). The source of truth is two short files:

- `requirements.in` — direct runtime dependencies
- `requirements-dev.in` — additional development and test dependencies

These are compiled into fully-pinned lockfiles (`requirements.txt` and `requirements-dev.txt`) which `make install` uses. **Do not edit the lockfiles directly.**

To add or update a dependency:
```sh
# 1. Edit requirements.in or requirements-dev.in
make compile-requirements   # regenerates the lockfiles
make install                # installs the updated packages
git add requirements*.in requirements*.txt
git commit
```
