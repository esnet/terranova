# Maps

A **map** is a named, versioned visualization composed of one or more layers. Each layer references a dataset and defines how that dataset's topology should be styled and displayed. Maps can be published for embedding in external applications.

## Data model

```python
Map:
  mapId: str                          # 7-character alphanumeric ID
  name: str                           # Human-readable name
  version: int                        # Version number (increments on each save)
  lastUpdatedBy: str
  lastUpdatedOn: datetime
  public: bool | None                 # Whether the map is publicly accessible
  configuration: MapConfiguration     # Display configuration
  overrides: dict[datasetId, MapOverrides]  # Per-dataset node/edge overrides
```

## Configuration

`MapConfiguration` controls how the map is displayed:

```python
MapConfiguration:
  # Viewport
  initialViewStrategy: str    # How to set the initial view ("manual" or coordinate-based)
  viewport: Viewport          # center lat/lng, zoom, or bounding box
  latitudeVar: str | None     # Datasource field for node latitude
  longitudeVar: str | None    # Datasource field for node longitude

  # Background
  background: str             # CSS background color or "none"
  tileset: TilesetConfiguration  # Map tile provider (geographic mode)

  # Layers (up to LAYER_LIMIT, default 3)
  layers: list[LayerConfiguration]

  # UI options
  showSidebar: bool
  showViewControls: bool
  showLegend: bool
  legendColumnLength: int | None
  legendPosition: str | None
  legendDefaultBehavior: str | None
  enableScrolling: bool
  enableNodeAnimation: bool
  enableEdgeAnimation: bool

  # Edge coloration
  thresholds: list | None
  zIndexBase: int
```

## Layers

Each layer in a map corresponds to one dataset. The layer configuration controls how that dataset's nodes and edges are rendered:

```python
LayerConfiguration:
  name: str           # Display name shown in the legend
  visible: bool       # Whether this layer is shown by default
  color: str          # Default color for nodes and edges

  # Node sizing
  nodeWidth: float

  # Edge styling
  edgeWidth: float
  pathOffset: float   # Offset between parallel edges

  # Topology source
  jsonFromUrl: bool   # Load topology JSON from a URL instead of the API
  mapjson: str | None           # Inline topology JSON
  mapjsonUrl: str | None        # URL to fetch topology JSON from

  # Data matching
  endpointId: str              # Field identifying circuit endpoints
  inboundValueField: str | None  # Field for inbound traffic values
  outboundValueField: str | None # Field for outbound traffic values
  srcField: str | None           # Source endpoint field
  dstField: str | None           # Destination endpoint field
```

## Overrides

Overrides let you customize individual nodes and edges within a layer without changing the underlying dataset. Each override targets a specific node or edge by its ID and specifies an operation:

- **`override`** — modify the node/edge state (color, label, etc.)
- **`add`** — add a node/edge that doesn't exist in the dataset
- **`delete`** — hide a node/edge from the map

Overrides are stored per dataset (keyed by `datasetId`), so the same override set applies to every layer that uses that dataset.

## Viewport

The viewport defines the initial view when the map is opened:

```python
Viewport:
  center: ViewportCenter | None   # {lat, lng} of the map center
  zoom: float | None              # Initial zoom level
  top: float | None               # Bounding box (alternative to center+zoom)
  left: float | None
  bottom: float | None
  right: float | None
```

## Versioning

Like datasets, every map save creates a new version. The `latest` version is returned by default. Older versions are retained and accessible via the API.

## Publishing

Setting `public: true` on a map makes it accessible to unauthenticated requests via the public map endpoints. This is used to embed maps in external applications without requiring viewers to log in.

See [Map Output](../user-guide/map-output.md) for embedding instructions.
