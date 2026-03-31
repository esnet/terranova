# FAQ

## General

### What is Terranova?

Terranova is an open-source web application for building and publishing interactive network map visualizations. It connects to network topology data sources (like Google Sheets), lets you query and filter that data into datasets, and composes those datasets into layered, embeddable maps.

### What kind of data does Terranova work with?

Terranova is designed for network topology data — circuits, links, and nodes with associated metadata like location coordinates, endpoint names, and traffic values. Data sources must conform to the [Terranova Topology Format](https://docs.google.com/spreadsheets/d/191BuMoWa2CooMXJQzyNtBRlNLHamBmh-8PCoIGDELxA/edit).

### What storage backend should I use?

Use **SQLite** for development and small deployments. Use **Elasticsearch** for production deployments that need scalability or high availability. See [Storage Backends](deployment/storage-backends.md) for a detailed comparison.

### Can I use Terranova without Google Sheets?

Yes. Google Sheets is the built-in datasource, but the datasource architecture is pluggable. You can implement a custom datasource for any data source that can return topology data. See [Datasources](concepts/datasources.md) for the plugin interface.

If you have no datasources configured, you can still create and edit maps using the topology JSON URL feature (point a map layer directly at a JSON endpoint).

---

## Authentication

### What's the difference between basic auth and Keycloak OIDC?

**Basic auth** is built into Terranova — users are stored in a local SQLite database and managed via the API. It's simple but less secure and not suitable for large organizations.

**Keycloak OIDC** delegates authentication to a Keycloak realm. It supports SSO, group-based access control, and enterprise identity provider integration. Recommended for production deployments.

See [Authentication](concepts/authentication.md) for details.

### How do I create my first user with basic auth?

On a fresh install with basic auth, the user database is empty and the first user can be created without authentication:

```sh
curl -X POST http://localhost:8000/api/v1/user \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "name": "Admin",
    "password": "yourpassword",
    "scope": ["terranova:maps:read", "terranova:maps:write", "terranova:maps:publish", "terranova:admin"]
  }'
```

### How do I reset a user's password?

With basic auth and admin access:

```sh
curl -X PUT http://localhost:8000/api/v1/user/{username}/set_password/ \
  -u admin:adminpassword \
  -H "Content-Type: application/json" \
  -d '{"password": "newpassword"}'
```

---

## Maps and datasets

### How do I make a map publicly accessible?

Mark the map as public using the publish action in the Map Editor (requires the `publish` scope). Public maps are accessible via the `/api/v1/public/output/map/{mapId}/` endpoint without authentication.

See [Map Output](user-guide/map-output.md) for embedding instructions.

### Why does my dataset show no data?

A dataset requires at least one filter to produce results. Open the Dataset Editor, add a filter in the Query Panel, and save. The visualization will update once the query returns data.

### How do I embed a map in my application?

Use the [esnet-networkmap-panel](https://github.com/esnet/esnet-networkmap-panel) widget with the public output URL of a published map. See [Map Output](user-guide/map-output.md) for a complete example.

### What is the layer limit?

By default, maps support up to 3 layers. This is configurable via `LAYER_LIMIT` in `settings.js`.

---

## Development

### How do I report a bug?

Open an issue on [GitHub](https://github.com/esnet/terranova/issues) with:

- Steps to reproduce
- Expected behavior
- Actual behavior
- Terranova version and deployment method (Docker / local)

### How do I contribute code?

See the [Contributing guide](contributing/index.md) for the full process. In short: fork, branch, implement, test, open a pull request.

### Where can I ask questions?

Open a [GitHub Discussion](https://github.com/esnet/terranova/discussions) or file an issue.
