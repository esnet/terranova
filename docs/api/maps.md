# Maps API

Endpoints for creating, reading, updating, and publishing maps.

## List maps

```
GET /api/v1/maps/
```

Returns all maps (latest version of each by default).

**Scope required:** `read`

**Query parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `version` | `latest` \| `all` \| integer | `latest` | Which version(s) to return |
| `fields` | list of field names | `mapId, name, version, lastUpdatedBy, lastUpdatedOn` | Fields to include in the response |
| `mapId` | string | — | Filter by map ID |
| `name` | string | — | Filter by name |
| `lastUpdatedBy` | string | — | Filter by editor username |
| `public` | boolean | — | Filter by public status |

**Example:**

```sh
curl http://localhost:8000/api/v1/maps/ \
  -H "Authorization: Bearer <token>"
```

---

## Get map by ID

```
GET /api/v1/map/id/{mapId}/
```

Returns the full map object for the given ID (latest version).

**Scope required:** `read`

**Path parameters:**

| Parameter | Description |
|---|---|
| `mapId` | 7-character map ID |

---

## Create map

```
POST /api/v1/map/
```

Creates a new map and returns it with its assigned `mapId`.

**Scope required:** `write`

**Request body:** `MapRevision`

```json
{
  "name": "My Map",
  "configuration": {
    "initialViewStrategy": "manual",
    "viewport": { "center": { "lat": 37.8, "lng": -96.9 }, "zoom": 4 },
    "background": "#f0f0f0",
    "tileset": {},
    "editMode": false,
    "showSidebar": true,
    "showViewControls": true,
    "showLegend": true,
    "enableScrolling": true,
    "enableEditing": false,
    "enableNodeAnimation": false,
    "enableEdgeAnimation": false,
    "zIndexBase": 0,
    "layers": []
  },
  "overrides": {}
}
```

---

## Update map

```
PUT /api/v1/map/id/{mapId}/
```

Saves a new version of an existing map.

**Scope required:** `write`

**Path parameters:**

| Parameter | Description |
|---|---|
| `mapId` | 7-character map ID |

**Request body:** `MapRevision` (same structure as create)

---

## Publish map

```
POST /api/v1/map/id/{mapId}/publish/
```

Marks a map as public, making it accessible via the unauthenticated public output endpoints.

**Scope required:** `publish`

---

## List public maps

```
GET /api/v1/public/maps/
```

Returns all maps where `public: true`. No authentication required.

**Query parameters:** same as [List maps](#list-maps) (except no `public` filter — always true)
