# Authentication API

User management endpoints for the basic authentication backend. These endpoints are only available when `auth.backend: basic` is configured.

For Keycloak OIDC, user management is handled in Keycloak — these endpoints are not available.

## Get current user

```
GET /api/v1/current_user/
```

Returns the currently authenticated user's details.

**Scope required:** `read`

**Response:**

```json
{
  "username": "alice",
  "name": "Alice",
  "email": "alice",
  "scope": ["terranova:maps:read", "terranova:maps:write"]
}
```

---

## List users

```
GET /api/v1/user/
```

Returns a list of users (up to 10 by default).

**Scope required:** `admin`

**Query parameters:**

| Parameter | Default | Description |
|---|---|---|
| `limit` | `10` | Maximum number of users to return |

---

## Create user

```
POST /api/v1/user
```

Creates a new user.

**Scope required:** `admin`

**Request body:**

```json
{
  "username": "alice",
  "name": "Alice",
  "password": "securepassword",
  "scope": ["terranova:maps:read", "terranova:maps:write"]
}
```

Valid scope values (must match `settings.yml` auth scope configuration):

- `terranova:maps:read`
- `terranova:maps:write`
- `terranova:maps:publish`
- `terranova:admin`

---

## Update user

```
PUT /api/v1/user/{username}/
```

Updates a user's name and scope. Does not change the password.

**Scope required:** `admin`

**Request body:**

```json
{
  "username": "alice",
  "name": "Alice Smith",
  "scope": ["terranova:maps:read", "terranova:maps:write", "terranova:maps:publish"]
}
```

---

## Reset password

```
PUT /api/v1/user/{username}/set_password/
```

Sets a new password for a user.

**Scope required:** `admin`

**Request body:**

```json
{
  "password": "newpassword"
}
```

---

## Delete user

```
DELETE /api/v1/user/{username}/
```

Permanently deletes a user.

**Scope required:** `admin`
