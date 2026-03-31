# Forking a Map

Forking creates a new map that starts with the same configuration (layers, viewport, styling, and overrides) as an existing map. It is useful for creating regional variants or styled copies of an existing map.

## How to fork

1. Navigate to **Libraries → Maps → Create New Map** or go to `/map/new`
2. Toggle **Fork Existing Map** on
3. Select the **Map Name** to fork from
4. Select the **Version** to use as the starting point
5. Give your new map a name
6. Click **Create Map**

The new map starts with the same `configuration` and `overrides` as the selected version. It gets a new `mapId` and starts at version 1.

## What is copied

| Copied | Not copied |
|---|---|
| Layer configuration (datasets, colors, widths) | The `mapId` |
| Viewport (center, zoom) | Version history |
| Overrides (per-node/edge customizations) | `public` flag (new map starts private) |
| Tileset configuration | |

## After forking

The Map Editor opens on the new map. You can change any layer, override, or viewport setting without affecting the source map.
