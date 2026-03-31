# Map Editor

The Map Editor is the main workspace for configuring a map's layers, viewport, and per-node overrides.

## Layout

```
┌──────────────────────────────────────────────────────┐
│  Topbar: [b]Editing:[/b] Map Name       [Save Map]   │
├──────────────────────────────────────────────────────┤
│                                                      │
│           Interactive Map Preview                    │
│           (esnet-networkmap-panel)                   │
│                                                      │
├──────────────────────────────────────────────────────┤
│  Layer Options Panel                                 │
├──────────────────────────────────────────────────────┤
│  Overrides Panel                                     │
└──────────────────────────────────────────────────────┘
```

## Topbar

- **Map name** — displayed next to "Editing:". Click the name or pencil icon to rename inline.
- **Save Map** — saves the current configuration as a new version; shows a brief confirmation alert.

## Map preview

The central panel shows a live interactive preview of the map using the [esnet-networkmap-panel](https://github.com/esnet/esnet-networkmap-panel) widget. You can:

- Pan by dragging
- Zoom with the scroll wheel or pinch gesture
- Click nodes and edges to inspect their data
- Use the view controls (if enabled) to reset the viewport or toggle layers

The preview reflects the current map configuration including all layer settings and overrides.

## Layer Options Panel

Each map layer corresponds to one dataset. Up to `LAYER_LIMIT` layers (default: 3) can be added.

### Adding a layer

Click **Add Layer** to add a new layer. Select a dataset from the dropdown.

### Layer settings

| Setting | Description |
|---|---|
| **Dataset** | The dataset this layer reads topology from |
| **Name** | Layer name shown in the map legend |
| **Visible** | Whether the layer is shown by default |
| **Color** | Default color for all nodes and edges in this layer |
| **Edge Width** | Stroke width for edges |
| **Node Width** | Size of node markers |
| **Path Offset** | Offset between parallel edges (useful when layers share edges) |
| **Endpoint ID field** | The datasource field that identifies circuit endpoints |
| **Inbound / Outbound value fields** | Fields for traffic volume data (used for threshold coloring) |
| **Source / Destination fields** | Fields identifying the two ends of each circuit |
| **Node Template** | Custom SVG template for node rendering |
| **Topology source** | Load topology JSON from the API (default) or from a URL |

### Removing a layer

Click the remove button on a layer to delete it from the map. The dataset itself is not affected.

## Overrides Panel

Overrides let you customize individual nodes and edges in a layer — changing their appearance, adding annotations, or hiding them entirely — without modifying the underlying dataset.

### Adding an override

1. Click a node or edge in the map preview to select it
2. In the Overrides Panel, configure the override:
   - **Operation**: `override` (modify), `add` (insert a new element), or `delete` (hide)
   - **State**: the new properties to apply (color, label, etc.)
   - **Render**: whether to render the element

### Scope of overrides

Overrides are stored per dataset (keyed by dataset ID). An override applied to a dataset affects that dataset's nodes and edges across all layers that reference it.

## Viewport

The initial viewport (center, zoom) is captured from wherever you have the map preview positioned when you save. Pan and zoom the preview to the desired default view, then save.

## Publishing

To make the map accessible without authentication, see [Map Output](map-output.md).
