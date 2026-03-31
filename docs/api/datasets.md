# Datasets API

Endpoints for creating, reading, and updating datasets.

## List datasets

```
GET /api/v1/datasets/
```

Returns all datasets (latest version of each by default).

**Scope required:** `read`

**Query parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `version` | `latest` \| `all` \| integer | `latest` | Which version(s) to return |
| `fields` | list of field names | `datasetId, name, version, lastUpdatedBy, lastUpdatedOn` | Fields to include |
| `datasetId` | string | — | Filter by dataset ID |
| `name` | string | — | Filter by name |
| `lastUpdatedBy` | string | — | Filter by editor username |

---

## Get dataset by ID

```
GET /api/v1/dataset/id/{datasetId}/
```

Returns the full dataset object for the given ID (latest version).

**Scope required:** `read`

**Path parameters:**

| Parameter | Description |
|---|---|
| `datasetId` | 7-character dataset ID |

---

## Create dataset

```
POST /api/v1/dataset/
```

Creates a new dataset. The query is saved but not executed — results are populated when the dataset is updated with a query that has at least one filter.

**Scope required:** `write`

**Request body:** `DatasetRevision`

```json
{
  "name": "My Dataset",
  "query": {
    "endpoint": "google_sheets?sheet_id=abc123",
    "filters": [],
    "node_deduplication_field": "location_name",
    "node_group_criteria": null,
    "node_group_layout": null
  }
}
```

---

## Update dataset

```
PUT /api/v1/dataset/id/{datasetId}/
```

Saves a new version of the dataset. The query is executed against the datasource, and the results are stored in the new version.

**Scope required:** `write`

**Path parameters:**

| Parameter | Description |
|---|---|
| `datasetId` | 7-character dataset ID |

**Request body:** `DatasetRevision` (same structure as create)

!!! note
    Updating a dataset executes the query live against the datasource. If the datasource is unavailable, the update will fail.
