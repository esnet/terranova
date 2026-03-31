# Node Templates

A **node template** is a named, versioned SVG fragment that defines the visual shape of a network node on a map. Templates let you replace the default rectangle or label with a custom graphic — a router icon, a site marker, a logo, or any other SVG element.

## Data model

```python
Template:
  templateId: str       # 7-character alphanumeric ID
  name: str             # Human-readable name
  version: int          # Version number
  lastUpdatedBy: str
  lastUpdatedOn: datetime
  template: str         # The SVG fragment (with optional Jinja2 template variables)
```

## SVG fragments

The `template` field contains a raw SVG fragment — the contents of a `<g>` element. The fragment is inserted into the map's SVG output at the position of each node.

A simple square node (the default geographic node):

```svg
<g><rect x='-4' y='-4' width='8' height='8' /></g>
```

A label node (the default logical node) using Jinja2 templating:

```svg
<g>
  <foreignObject width="30" height="15" overflow="visible">
    <div xmlns="http://www.w3.org/1999/xhtml"
         style="border: 1px solid rgba(0,0,0,0.2); padding: 2px 5px;
                border-radius: 15px; font-size: 10px; background: white;
                text-align: center;">
      {{ endpoint_name }}
    </div>
  </foreignObject>
</g>
```

## Jinja2 template variables

Node templates can include Jinja2 variable expressions (`{{ variable_name }}`). These are substituted with values from the node's data at render time.

Commonly available variables include `endpoint_name` and other fields present in the datasource data for that node.

## Built-in defaults

Terranova ships two built-in templates that are used when no custom template has been assigned:

| Mode | Template |
|---|---|
| Geographic | `<g><rect x='-4' y='-4' width='8' height='8' /></g>` |
| Logical | A rounded label showing `{{ endpoint_name }}` |

## Assigning templates to layers

Templates are assigned to map layers in the Map Editor. Each layer can have a different node template. If no template is assigned, the built-in default for the current visualization mode is used.

!!! note
    The Node Template Editor is an advanced feature. Most users will not need to create custom templates.
