# Configuration

Terranova uses two configuration files:

| File | Purpose |
|---|---|
| `/etc/terranova/settings.yml` | Backend (API) configuration |
| `/etc/terranova/settings.js` | Frontend configuration |

Default copies of both files are included in the repository under `etc/terranova/` and can be installed with:

```sh
sudo cp -R etc/terranova /etc/
```

The config path can be overridden with the `TERRANOVA_CONF` environment variable:

```sh
TERRANOVA_CONF=/my/custom/settings.yml uvicorn terranova.api:app
```

---

## Backend configuration (`settings.yml`)

### Top-level fields

| Field | Default | Description |
|---|---|---|
| `version` | — | Config file version (informational) |
| `environment` | `""` | Environment name (`dev`, `prod`, etc.) |

---

### `storage`

Selects the storage backend for maps, datasets, templates, and user data.

```yaml
storage:
  backend: sqlite          # "sqlite" (default) or "elasticsearch"
  sqlite_path: ./terranova.db  # SQLite only: path to the database file
```

See [Storage Backends](../deployment/storage-backends.md) for a full comparison.

---

### `elastic`

Required when `storage.backend` is `elasticsearch`.

```yaml
elastic:
  url: http://localhost:9200
  username: elastic
  password: changeme
  indices:
    map:
      read: terranova-map-*
      write: terranova-map
    template:
      read: terranova-template-*
      write: terranova-template
    dataset:
      read: terranova-dataset-*
      write: terranova-dataset
    userdata:
      read: terranova-userdata-*
      write: terranova-userdata
```

The `read` index can be a wildcard pattern (e.g. `terranova-map-*`) to query across multiple indices. The `write` index must be a single index name.

---

### `auth`

```yaml
auth:
  backend: basic           # "basic" or "keycloak"
  read_scope: "terranova:maps:read"
  write_scope: "terranova:maps:write"
  publish_scope: "terranova:maps:publish"
  admin_scope: "terranova:admin"
```

Scope names are configurable but must match what is set in `settings.js` and (for Keycloak) in the Keycloak realm configuration.

---

### `basic_auth`

Required when `auth.backend` is `basic`.

```yaml
basic_auth:
  db_filename: /var/tmp/basic_auth.sqlite
```

The basic auth database stores usernames, hashed passwords, and scopes. It is created automatically on first run. Users are managed via the API (`POST /user`).

---

### `keycloak`

Required when `auth.backend` is `keycloak`.

```yaml
keycloak:
  server: auth.example.com
  realm: my_realm
  client: terranova
  client_secret: ""        # optional
  public_key: ""           # optional; fetched from Keycloak if omitted
```

See [Keycloak OIDC](../deployment/keycloak.md) for setup instructions.

---

### `datasources`

Configures external data sources. The built-in datasource is `google_sheets`.

```yaml
datasources:
  google_sheets:
    credential_type: static     # "static" (recommended) or "dynamic"
    cache_file: google_sheets.sqlite
    static:
      token_files:
        - /etc/terranova/private_jwt.json
```

See [Google Sheets Setup](../deployment/google-sheets-setup.md) for instructions on creating a service account and generating the JSON credential file.

---

### `otlp` (optional)

OpenTelemetry trace and log export.

```yaml
otlp:
  endpoint: https://localhost:8200/intake/v2/events
  secret_key: your-secret-key
```

---

## Frontend configuration (`settings.js`)

The frontend settings file is a JavaScript ES module that is loaded by the browser at runtime. It is separate from the backend config so the frontend can be served as static files independently of the API.

```js
// URL of the Terranova API
export const API_URL = `http://localhost:8000/api/v1/`;

// Authentication backend: "basic" or "oidc"
export const AUTH_BACKEND = `basic`;

// Store auth token in sessionStorage (convenient but less secure)
export const AUTH_SESSION_STORAGE = true;

// OIDC settings — only used when AUTH_BACKEND is "oidc"
export const OIDC_REDIRECT_URI = `http://localhost:5173/`;
export const OIDC_LOGOUT_REDIRECT_URI = `http://localhost:5173/login`;
export const OIDC_CLIENT_ID = `terranova`;
export const OIDC_AUTHORITY = `https://auth.example.com/auth/realms/my_realm`;

// Scope names — must match settings.yml auth scopes
export const READ_SCOPE = `terranova:maps:read`;
export const READ_WRITE_SCOPE = `terranova:maps:write`;
export const PUBLISH_SCOPE = `terranova:maps:publish`;
export const ADMIN_SCOPE = `terranova:admin`;

// How long to cache API responses in the frontend (seconds)
export const CACHE_DURATION_IN_SECONDS = 60;

// Maximum number of layers per map
export const LAYER_LIMIT = 3;

// How long to show the "Saved" tooltip (seconds)
export const TOOLTIP_TTL = 2;

// Google Sheets credential source: "static" (recommended) or "dynamic"
export const GOOGLE_SHEETS_CREDENTIAL_SOURCE = `static`;
```

In Docker deployments, mount your custom `settings.js` over the one baked into the image:

```sh
docker run \
  -v /path/to/your/settings.js:/terranova/static/settings.js \
  ...
```
