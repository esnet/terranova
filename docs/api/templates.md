# Templates API

Endpoints for creating, reading, and updating node templates.

## List templates

```
GET /api/v1/templates/
```

Returns all templates (latest version of each by default).

**Scope required:** `read`

**Query parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `version` | `latest` \| `all` \| integer | `latest` | Which version(s) to return |
| `fields` | list of field names | `templateId, name, version, lastUpdatedBy, lastUpdatedOn` | Fields to include |
| `templateId` | string | — | Filter by template ID |
| `name` | string | — | Filter by name |
| `lastUpdatedBy` | string | — | Filter by editor username |

---

## Get template by ID

```
GET /api/v1/template/id/{templateId}/
```

Returns the full template object for the given ID (latest version).

**Scope required:** `read`

---

## Create template

```
POST /api/v1/template/
```

Creates a new node template.

**Scope required:** `write`

**Request body:** `NewTemplate`

```json
{
  "name": "Diamond Node",
  "template": "<g><polygon points='0,-8 8,0 0,8 -8,0' /></g>"
}
```

---

## Update template

```
PUT /api/v1/template/id/{templateId}/
```

Saves a new version of an existing template.

**Scope required:** `write`

**Path parameters:**

| Parameter | Description |
|---|---|
| `templateId` | 7-character template ID |

**Request body:** `NewTemplate` (same structure as create)
