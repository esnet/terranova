# Keycloak OIDC

Terranova supports [Keycloak](https://www.keycloak.org/) as an OpenID Connect (OIDC) authentication provider. This is the recommended authentication backend for production deployments.

## How it works

When `auth.backend: keycloak` is configured:

1. The user clicks **Login** in Terranova's UI
2. The browser redirects to the Keycloak login page
3. The user authenticates with Keycloak
4. Keycloak redirects back to Terranova with an OIDC ID token
5. Terranova validates the token and extracts the user's scopes from the token claims
6. The user is granted access based on their scopes

## Prerequisites

- A running Keycloak instance
- A configured Keycloak realm with a client for Terranova

## Keycloak configuration

### Create a client

In your Keycloak realm:

1. Go to **Clients → Create client**
2. Set **Client ID** to `terranova` (or your preferred name)
3. Set **Client authentication** to off (public client)
4. Set the **Valid redirect URIs** to `http://your-terranova-instance/*`
5. Set the **Web origins** to `http://your-terranova-instance`

### Configure scopes

Terranova uses custom scopes to control access. Add these as client scopes in Keycloak and assign them to users or groups:

- `terranova:maps:read`
- `terranova:maps:write`
- `terranova:maps:publish`
- `terranova:admin`

These names are configurable — see the `auth` section of `settings.yml`.

## Terranova backend configuration

In `/etc/terranova/settings.yml`:

```yaml
auth:
  backend: keycloak
  read_scope: "terranova:maps:read"
  write_scope: "terranova:maps:write"
  publish_scope: "terranova:maps:publish"
  admin_scope: "terranova:admin"

keycloak:
  server: auth.example.com        # Keycloak hostname (no protocol or path)
  realm: my_realm                 # Keycloak realm name
  client: terranova               # Client ID from Keycloak
  client_secret: ""               # Leave empty for public clients
  public_key: ""                  # Optional; fetched from Keycloak if omitted
```

## Terranova frontend configuration

In `/etc/terranova/settings.js`:

```js
export const AUTH_BACKEND = `oidc`;

export const OIDC_CLIENT_ID = `terranova`;
export const OIDC_AUTHORITY = `https://auth.example.com/auth/realms/my_realm`;
export const OIDC_REDIRECT_URI = `http://your-terranova-instance/`;
export const OIDC_LOGOUT_REDIRECT_URI = `http://your-terranova-instance/login`;

// Must match settings.yml
export const READ_SCOPE = `terranova:maps:read`;
export const READ_WRITE_SCOPE = `terranova:maps:write`;
export const PUBLISH_SCOPE = `terranova:maps:publish`;
export const ADMIN_SCOPE = `terranova:admin`;
```

!!! note
    `OIDC_AUTHORITY` must be the full URL including the realm path: `https://{server}/auth/realms/{realm}`.
