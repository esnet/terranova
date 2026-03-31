# Storage Backends

Terranova supports two interchangeable storage backends. The backend is selected in `settings.yml` via `storage.backend` and can be changed at any time (with appropriate data migration).

## Comparison

| | SQLite | Elasticsearch |
|---|---|---|
| **Setup** | None — file-based | Requires a running cluster |
| **Best for** | Development, small deployments | Production, large deployments |
| **Scale** | Up to ~100k documents | Millions of documents |
| **High availability** | No | Yes |
| **Horizontal scaling** | No | Yes |
| **Advanced search** | No | Yes |
| **Test coverage** | 97% | 97% |

Both backends implement an identical interface. Switching between them requires only a config change and data migration (if needed).

## SQLite configuration

```yaml
storage:
  backend: sqlite
  sqlite_path: ./terranova.db   # path to the database file (relative to working directory)
```

The database file is created automatically on first run. No external services required.

**Use SQLite when:**

- Setting up a development environment
- Running a single-server deployment with a small number of maps and datasets
- You want zero external dependencies

## Elasticsearch configuration

```yaml
storage:
  backend: elasticsearch

elastic:
  url: http://localhost:9200
  username: elastic
  password: changeme
  indices:
    map:
      read: terranova-map-*    # wildcard: query across all map indices
      write: terranova-map     # single index for writes
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

Terranova creates the write indices automatically on first use if they do not exist.

The `read` index can be a wildcard pattern (e.g. `terranova-map-*`) to query across multiple indices — useful if you use index aliases or time-based indices. The `write` index must be a single named index.

**Use Elasticsearch when:**

- Deploying to production
- Expecting large numbers of documents (maps, datasets, templates)
- High availability is required
- You are already running Elasticsearch infrastructure

## Migrating between backends

There is no automated migration tool. To move data between backends:

1. Export your data via the API (list all maps, datasets, templates)
2. Switch the `storage.backend` in `settings.yml`
3. Re-import via the API

For small deployments this is manageable manually. For larger deployments, a scripted approach using the REST API is recommended.
