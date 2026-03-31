# Dataset Editor

The Dataset Editor is the main workspace for configuring a dataset's query and previewing the resulting topology data.

## Layout

The Dataset Editor has three sections:

```
┌─────────────────────────────────────────────────┐
│  Topbar: dataset name  [Discard Changes] [Save]  │
├────────────────────────────┬────────────────────┤
│                            │                     │
│   Visualization preview    │  Visualization      │
│   (logical / geographic /  │  mode selector +    │
│    table view)             │  sidebar controls   │
│                            │                     │
├────────────────────────────┴────────────────────┤
│  Query Panel (endpoint + filters)                │
├─────────────────────────────────────────────────┤
│  Node Options Panel                              │
└─────────────────────────────────────────────────┘
```

## Topbar

- **Dataset name** — click the pencil icon to rename the dataset inline
- **Discard Changes** — reloads the dataset from the last saved version
- **Save Changes** — saves the current query as a new version; shows a "Saved New Version: N" tooltip briefly

## Visualization preview

Shows a live preview of the dataset's topology data. Three visualization modes are available (toggle in the sidebar):

**Logical** — an interactive graph layout showing nodes and edges. Useful for verifying that circuits are connected correctly.

**Geographic** — nodes plotted on a geographic map at their coordinates. Useful for verifying location data.

**Table View** — the raw circuit records as a table. Useful for inspecting the underlying data.

The preview updates automatically when you change the dataset query and save, or when you switch visualization modes.

## Query Panel

The Query Panel is where you define what data the dataset contains.

### Endpoint

Select the datasource endpoint to query. The available endpoints come from the datasources configured in `settings.yml`. Each endpoint corresponds to a data table or sheet.

### Filters

Filters narrow the results to a specific subset of the endpoint's data. Each filter specifies:

- **Filter type** — the kind of filter (depends on the datasource)
- **Field** — the data field to match against
- **Values** — the values to match

Add multiple filters to refine the selection further. All filters are applied as AND conditions.

!!! note
    A dataset with no filters produces no results. At least one filter is required for the visualization to show any data.

### Node deduplication

Controls how duplicate nodes (multiple records for the same physical location) are merged. Set the **Deduplication Field** to the field in your datasource that uniquely identifies a location.

## Node Options Panel

Provides additional controls for configuring how nodes are grouped and laid out. These settings affect the logical and geographic visualization modes.

## Favorites and recents

The star icon in the topbar toggles this dataset as a favorite. Favorited datasets appear in the **Favorites** section of the sidebar. Recently edited datasets appear in **Libraries → Datasets** in the sidebar.
