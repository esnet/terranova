# Node Template Editor

The Node Template Editor lets you create and edit custom SVG node shapes. Node templates replace the default square or label shapes used in map visualizations.

!!! note "Advanced feature"
    Most users will not need to create custom node templates. The default shapes work well for most network maps. This editor is intended for users who need custom iconography or branded node shapes.

## Opening the editor

Navigate to `/template/new` to create a new template, or click an existing template in the template library to edit it.

## Editor interface

The editor provides:

- **Name field** — a display name for the template
- **SVG editor** — a text area for entering the SVG fragment
- **Preview** — a live preview of the rendered node

## Writing a template

The template field accepts an SVG fragment — the content of a `<g>` element. The fragment is centered on the node's position on the map, so coordinates should be relative to `(0, 0)`.

Example: a simple diamond shape

```svg
<g>
  <polygon points="0,-8 8,0 0,8 -8,0" />
</g>
```

Example: a circle with a label

```svg
<g>
  <circle r="6" />
  <text y="16" text-anchor="middle" font-size="8">{{ endpoint_name }}</text>
</g>
```

### Jinja2 variables

Use `{{ variable_name }}` to insert data from the node's record at render time. Commonly available:

- `{{ endpoint_name }}` — the node's display name

The available variables depend on the fields present in the datasource data.

## Saving

Click **Save** to save the template. It will then be available in the Map Editor's layer configuration as a selectable node template.

## Default templates

If no custom template is assigned to a layer, Terranova uses its built-in defaults:

- **Geographic mode**: a small square (`<rect>`)
- **Logical mode**: a rounded label showing the endpoint name

See [Node Templates](../concepts/templates.md) for the full SVG source of each default.
