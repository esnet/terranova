# Map Output

Once a map is configured, Terranova provides several ways to get it out of the editor and into external applications.

## Publishing a map

To make a map accessible without authentication, it must be marked as **public**.

In the Map Editor, use the publish action to set `public: true` on the map. Public maps are accessible via the unauthenticated public output endpoints.

!!! note
    Only users with the `publish` scope can mark a map as public.

## Output endpoints

### Authenticated endpoints (require login)

| Endpoint | Description |
|---|---|
| `GET /api/v1/output/map/{mapId}/` | Full map JSON (configuration + overrides) |
| `GET /api/v1/output/map/{mapId}/svg/` | Map rendered as SVG |

These endpoints require the `write` scope. Use them for internal tooling or server-to-server integrations.

### Public endpoints (no authentication required)

| Endpoint | Description |
|---|---|
| `GET /api/v1/public/output/map/{mapId}/` | Map configuration JSON (public maps only) |
| `GET /api/v1/public/output/map/{mapId}/svg/` | Map rendered as SVG (public maps only) |

Public endpoints return a 404 for maps that have not been marked public.

All endpoints accept a `?version=N` query parameter to retrieve a specific version. The default is `latest`.

## Embedding the map widget

The [esnet-networkmap-panel](https://github.com/esnet/esnet-networkmap-panel) widget can be embedded in any web page and pointed at a Terranova public output endpoint.

```html
<!-- Basic embedding example -->
<script src="https://unpkg.com/esnet-networkmap-panel/dist/esnet-networkmap-panel.js"></script>

<esnet-network-map
  url="https://your-terranova-instance/api/v1/public/output/map/{mapId}/"
  height="600"
  width="100%">
</esnet-network-map>
```

Refer to the [esnet-networkmap-panel documentation](https://github.com/esnet/esnet-networkmap-panel) for the full set of configuration options.

## SVG export

The `/svg/` output type returns a static SVG rendering of the map. This can be:

- Saved as a file and included in reports or presentations
- Embedded directly in HTML with an `<img>` tag or inline `<svg>`
- Served from a CDN for use in dashboards that cannot run JavaScript

```sh
# Download the SVG for a public map
curl https://your-terranova-instance/api/v1/public/output/map/{mapId}/svg/ \
  -o my-map.svg
```

## Dataset output endpoints

Dataset topology data is also available via the output API, independently of maps:

| Endpoint | Description |
|---|---|
| `GET /api/v1/output/dataset/{datasetId}/{layout}/{datatype}/{output_type}/` | Dataset topology output |

- `layout`: `logical` or `geographic`
- `datatype`: `snapshot` (stored results) or `dynamic` (live query)
- `output_type`: `json` or `svg`

These endpoints require the `read` scope.
