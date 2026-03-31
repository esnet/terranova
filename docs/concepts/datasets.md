# Datasets

A **dataset** is a named, versioned query against a datasource. It defines which network circuits or topology elements to include, and how to deduplicate and group them. Datasets are the building blocks of maps — each map layer references a dataset to determine what to draw.

## Data model

```python
Dataset:
  datasetId: str         # 7-character alphanumeric ID
  name: str              # Human-readable name
  version: int           # Version number (increments on each save)
  lastUpdatedBy: str     # Username of the last editor
  lastUpdatedOn: datetime
  query: DatasetQuery    # The query definition
  results: list | None   # Resolved results (set when query has filters)
```

## The query

The core of a dataset is its `DatasetQuery`:

```python
DatasetQuery:
  endpoint: str                    # Which datasource endpoint to query
  filters: list[QueryFilter]       # Filter criteria to apply
  node_deduplication_field: str    # Field used to merge duplicate nodes (default: "location_name")
  node_group_criteria: list[str]   # Fields used to group nodes together
  node_group_layout: str           # Layout algorithm for grouped nodes
```

### Endpoint

The `endpoint` field selects which datasource (and which table or sheet within it) to query. Available endpoints are discovered from the configured datasources and listed in the Dataset Editor's dropdown.

### Filters

Filters narrow down which records from the datasource are included. Each filter specifies a field name and one or more values to match. Filters are applied as AND conditions — all filters must match for a record to be included.

A dataset with no filters returns no results. At least one filter is required to produce output.

### Node deduplication

Network topology data often contains multiple records for the same physical location (one per circuit endpoint). The `node_deduplication_field` specifies which field to use when collapsing these duplicate nodes into a single point on the map.

The default is `location_name`. Set this to match the field in your datasource that uniquely identifies a physical site.

### Node grouping

`node_group_criteria` and `node_group_layout` control how nodes are grouped and laid out when multiple nodes share the same criteria values. This is used to cluster nodes that belong to the same logical group (e.g. all nodes in the same city).

## Versioning

Every time you save a dataset, a new version is created. Older versions are retained and accessible via the API. The API returns the `latest` version by default.

This means:

- Changes to a dataset do not immediately affect maps that reference it (maps reference the dataset by ID and always use the latest version)
- You can retrieve any historical version via `GET /api/v1/dataset/id/{datasetId}?version={n}`

## Snapshots vs. live output

A dataset's `results` field is populated when the dataset has at least one filter and the datasource has been queried. These results represent the datasource data at the time the dataset was last fetched.

The **Dataset Dynamic Output** endpoints (`/api/v1/output/query/`) re-execute the query live at request time, without saving a new version. This is used by the Dataset Editor's preview to show current topology data.

## Forking

You can create a new dataset by forking an existing one. Forking copies the query definition (endpoint + filters) from a specific version of the source dataset into a new dataset with a new ID. This is useful for creating variations of an existing query.
