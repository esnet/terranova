# API Reference

Terranova exposes a versioned REST API under `/api/v1/`. All endpoints return JSON unless otherwise noted.

## Interactive documentation

Any running Terranova instance auto-generates interactive API documentation via FastAPI:

- **Swagger UI**: `http://your-instance/docs`
- **ReDoc**: `http://your-instance/redoc`
- **OpenAPI JSON**: `http://your-instance/openapi.json`

The interactive docs let you explore and test all endpoints directly in the browser, including authentication.

## Base URL

```
http://your-instance/api/v1/
```

## Authentication

All endpoints (except public map output) require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Obtain a token via the auth endpoint appropriate for your configured backend.

## Common patterns

### Versioning

Resources support a `?version=` query parameter:

- `?version=latest` — most recent version (default)
- `?version=all` — all versions
- `?version=3` — a specific version number

### Field selection

List endpoints support `?fields=` to limit which fields are returned:

```
GET /api/v1/maps/?fields=mapId&fields=name&fields=version
```

Default fields for list endpoints: `mapId`/`datasetId`/`templateId`, `name`, `version`, `lastUpdatedBy`, `lastUpdatedOn`.

### Filtering

List endpoints support filter parameters specific to the resource type (e.g. `?mapId=abc1234`, `?name=My+Map`).

## API sections

| Section | Description |
|---|---|
| [Maps](maps.md) | Create, read, update, and publish maps |
| [Datasets](datasets.md) | Create, read, and update datasets |
| [Templates](templates.md) | Create, read, and update node templates |
| [Output](output.md) | Render maps and datasets as JSON or SVG |
| [Datasources](datasources.md) | Query available datasource endpoints |
| [Authentication](authentication.md) | User management and token endpoints |
