# Authentication

Terranova supports two authentication backends, selected via `settings.yml`. Both backends use the same set of named scopes to control access to API operations.

## Scopes

All API operations require an authenticated user with the appropriate scope:

| Scope | Default name | Grants access to |
|---|---|---|
| `read` | `terranova:maps:read` | Reading maps, datasets, templates, and topology data |
| `write` | `terranova:maps:write` | Creating and editing maps, datasets, and templates |
| `publish` | `terranova:maps:publish` | Marking maps as public |
| `admin` | `terranova:admin` | User management, all other operations |

Scope names are configurable in `settings.yml` under `auth` and must match the values in `settings.js`.

## Basic authentication

With `auth.backend: basic`, Terranova manages its own user database — a SQLite file at the path specified by `basic_auth.db_filename`.

Users are created and managed via the API:

```sh
# Create a user (requires admin credentials)
curl -X POST http://localhost:8000/api/v1/user \
  -u admin:yourpassword \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "name": "Alice",
    "password": "alicepassword",
    "scope": ["terranova:maps:read", "terranova:maps:write"]
  }'
```

The frontend uses HTTP Basic credentials to obtain a short-lived JWT, which is stored in the browser session and used for subsequent API calls.

!!! warning
    Basic authentication transmits credentials over the network. Always use HTTPS in production.

## Keycloak OIDC

With `auth.backend: keycloak`, Terranova delegates authentication to a [Keycloak](https://www.keycloak.org/) realm using OpenID Connect (OIDC).

Users log in via the Keycloak login page and are redirected back to Terranova with an OIDC token. Terranova validates the token and extracts the user's scopes from the token claims.

See [Keycloak OIDC](../deployment/keycloak.md) for setup instructions.

## Frontend configuration

The frontend must be configured with the same `AUTH_BACKEND` value as the backend, and with matching scope names. In `settings.js`:

```js
export const AUTH_BACKEND = `basic`;  // or "oidc"

export const READ_SCOPE = `terranova:maps:read`;
export const READ_WRITE_SCOPE = `terranova:maps:write`;
export const PUBLISH_SCOPE = `terranova:maps:publish`;
export const ADMIN_SCOPE = `terranova:admin`;
```
