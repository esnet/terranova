# Testing

Terranova has two test suites: Python API tests (pytest) and frontend end-to-end tests (Playwright via pytest).

## Running all tests

```sh
make test
```

This runs both the API and frontend test suites.

## API tests

```sh
make api-test
```

Runs the Python test suite under `tests/` (excluding `tests/frontend/`). Uses a test configuration from `SAMPLE_CONFIG.yml` by default.

To use a custom config:

```sh
TERRANOVA_CONF=/path/to/my/test-config.yml make api-test
```

The API tests cover:

- REST API endpoints (CRUD for maps, datasets, templates)
- Storage backend implementations (SQLite and Elasticsearch)
- Authentication backends
- Datasource backends

## Frontend tests

```sh
make frontend-test
```

Builds the frontend for testing (`pnpm run build-test`), then runs the Playwright end-to-end tests under `tests/frontend/`.

The test build is an unminified production build served by a local HTTP server. The tests use a SQLite-backed API server with mock authentication.

```sh
# Run with a visible browser (useful for debugging failing tests)
make frontend-test-headed
```

The frontend tests cover:

- Login / authentication flow
- Map creation, editing, and navigation
- Dataset creation, editing, and navigation
- Sidebar behavior (recently edited, favorites)
- Layout and UI rendering

## Test structure

```
tests/
  conftest.py                 # Shared fixtures (API server setup)
  api_circuits/               # Circuit query API tests
  api_root/                   # Root API tests
  api_types/                  # Type/model tests
  auth/                       # Authentication backend tests
  backends/                   # Storage backend tests (Elasticsearch, SQLite)
  fixtures/                   # Shared test fixtures
  frontend/
    conftest.py               # Frontend fixtures (server processes, login, test data)
    test_auth.py
    test_dataset.py
    test_dataset_editor.py
    test_home.py
    test_layout.py
    test_map.py
    test_map_editor.py
    test_navigation.py        # Sidebar navigation tests
    test_node_template.py
    test_sidebar.py
    utils/
      frontend_server.py      # Simple HTTP server for serving the test build
```

## Writing tests

### API tests

Use pytest with the fixtures in `tests/fixtures/`. Tests that require a database should use the SQLite or Elasticsearch fixture as appropriate. Mark tests that require no authentication with `@pytest.mark.anonymous`.

### Frontend tests

Use the Playwright fixtures in `tests/frontend/conftest.py`. The `login` fixture logs in before each test. The `create_test_map` and `create_test_dataset` fixtures create test resources.

Navigate via sidebar links rather than `page.goto()` when testing in-session navigation, to avoid triggering full page reloads that reset React context.
