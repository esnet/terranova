# Terranova

An app for building and editing maps

- [Getting Started](#getting-started)
- [Development](#development)

## Getting Started

### Clone this repo

```
git clone git@github.com:esnet/terranova.git
```

### Copy default default configs

```
sudo cp -R terranova/etc/terranova /etc/
```

This will create a directory named /etc/terranova with two files:
```
settings.js
settings.yml
```

The `settings.js` file contains frontend settings, while `settings.yml` contains backend settings.

### Configure Storage Backend

Terranova supports two storage backends for persisting maps, datasets, templates, and user data:

**SQLite (default)** - Lightweight file-based database ideal for development and small deployments.

**Elasticsearch** - Production-grade distributed search and analytics engine for scalable deployments.

#### SQLite Configuration (Default)

The default configuration uses SQLite with no additional setup required. To customize the database path, edit `/etc/terranova/settings.yml`:

```yaml
storage:
  backend: sqlite  # Default backend
  sqlite_path: ./terranova.db  # Optional: customize database location
```

#### Elasticsearch Configuration

For production deployments, edit `/etc/terranova/settings.yml`:

```yaml
storage:
  backend: elasticsearch

elastic:
  url: http://localhost:9200
  username: elastic
  password: changeme
  indices:
    template:
      read: terranova-template-*
      write: terranova-template
    map:
      read: terranova-map-*
      write: terranova-map
    dataset:
      read: terranova-dataset-*
      write: terranova-dataset
    userdata:
      read: terranova-userdata-*
      write: terranova-userdata
```

**When to use SQLite:**
- Local development
- Small deployments (< 100k documents)
- Simple setup without external dependencies
- Single-server deployments

**When to use Elasticsearch:**
- Production deployments
- Large datasets (millions of documents)
- High availability requirements
- Horizontal scalability needs
- Advanced search capabilities

Both backends provide identical functionality with 97% test coverage.

### Get an API token from Google

Terranova uses service accounts for authentication for spreadsheets. A Google service account can be configured within a project, which in turn belongs to an account or an organization. This differs from a normal user account.

The project that the service account is associated with needs to be granted access to the Google Sheets API and the Google Drive API.

The Google Sheets data source uses the scope https://www.googleapis.com/auth/spreadsheets.readonly to get read-only access to spreadsheets. It also uses the scope https://www.googleapis.com/auth/drive.metadata.readonly to list all spreadsheets that the service account has access to in Google Drive.

To create a service account, generate a Google JWT file and enable the APIs:

- Before you can use the Google APIs, you need to enable them in your Google Cloud project.
  - Open the Google Sheets API page and click enable.
  - Open the Google Drive API page and click enable.
- Open the Credentials page in the Google API Console.
- Click Create Credentials then Service account.
- Fill out the service account details form and then click Create and continue.
- Ignore the Service account permissions and Principals with access sections, just click Done.
- Click into the details for the service account, navigate to the Keys tab, and click Add Key. Choose key type JSON and click Create. A JSON key file will be created and downloaded to your computer.
- Save the token to `/etc/terranova/private_jwt.json`
- Grant read permission to spreadsheets that conform to the [Terranova Topology Format](https://docs.google.com/spreadsheets/d/191BuMoWa2CooMXJQzyNtBRlNLHamBmh-8PCoIGDELxA/edit)


### Build and start docker image

Overall the docker process uses `docker compose` to start an ElasticSearch image (for map persistence) as well as the application container for Terranova.

```
cd terranova  # change directory to the repo you just cloned
docker compose build  # this command builds the terranova docker image
docker compose up  # this command starts the elasticsearch and terranova image
```

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
