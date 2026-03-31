# Output API

Endpoints for rendering maps and datasets as JSON or SVG. See also [Map Output](../user-guide/map-output.md) for embedding guidance.

## Dataset output

```
GET /api/v1/output/dataset/{datasetId}/{layout}/{datatype}/{output_type}/
```

Returns rendered topology data for a dataset.

**Scope required:** `read`

**Path parameters:**

| Parameter | Values | Description |
|---|---|---|
| `datasetId` | 7-char ID | The dataset to render |
| `layout` | `logical`, `geographic` | How to arrange nodes |
| `datatype` | `snapshot`, `dynamic` | `snapshot` uses stored results; `dynamic` re-queries the datasource live |
| `output_type` | `json`, `svg` | Return format |

**Query parameters:**

| Parameter | Default | Description |
|---|---|---|
| `version` | `latest` | Dataset version to use |
| `template` | — | Template ID to use for node rendering |

---

## Map output (authenticated)

```
GET /api/v1/output/map/{mapId}/
GET /api/v1/output/map/{mapId}/svg/
```

Returns the full map configuration with topology data resolved, or an SVG rendering.

**Scope required:** `write`

**Path parameters:**

| Parameter | Description |
|---|---|
| `mapId` | 7-character map ID |

**Query parameters:**

| Parameter | Default | Description |
|---|---|---|
| `version` | `latest` | Map version to use |

The `/svg/` variant returns `Content-Type: image/svg+xml`.

---

## Map output (public, no authentication)

```
GET /api/v1/public/output/map/{mapId}/
GET /api/v1/public/output/map/{mapId}/svg/
```

Returns output for maps where `public: true`. No authentication required.

Returns `404` for maps that are not public.

**Path parameters:**

| Parameter | Description |
|---|---|
| `mapId` | 7-character map ID |

---

## In-progress map output

```
PATCH /api/v1/output/map/
```

Returns normalized map output for an unsaved map configuration. Used internally by the Map Editor to preview in-progress changes.

**Scope required:** `write`

**Request body:** `MapRevision`
