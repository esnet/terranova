# Terranova

Terranova is an open-source tool for building and editing interactive network maps. It provides a web-based editor for defining datasets — queries against live network data sources — and composing those datasets into richly-styled, embeddable map visualizations.

## What Terranova does

- **Connects to your data** — pull network topology data from Google Sheets or other configured datasources
- **Builds datasets** — define queries with filters and deduplication rules to shape the data for a specific map layer
- **Creates maps** — compose one or more datasets into a layered, interactive map with per-layer styling, thresholds, and viewport settings
- **Publishes maps** — export maps as embeddable widgets, static SVG, or JSON endpoints for use in external dashboards and applications

## Who it's for

Terranova is built for network engineers and operations teams who need to maintain and publish accurate, up-to-date visualizations of their network topology without writing custom visualization code.

## Key features

- Browser-based dataset and map editors with live preview
- Pluggable datasource architecture (Google Sheets built in)
- Two storage backends: SQLite for simple deployments, Elasticsearch for scale
- REST API for programmatic access to all resources
- Embeddable map widget powered by [esnet-networkmap-panel](https://github.com/esnet/esnet-networkmap-panel)
- Node template editor for custom SVG node shapes
- OIDC authentication via Keycloak, or built-in basic authentication

## Getting started

New to Terranova? Start here:

- [**Quickstart**](getting-started/quickstart.md) — up and running with Docker Compose in minutes
- [**Installation**](getting-started/installation.md) — full local development setup
- [**Configuration**](getting-started/configuration.md) — all configuration options explained

## Learn the concepts

- [**Datasets**](concepts/datasets.md) — how data queries and filters work
- [**Maps**](concepts/maps.md) — how layers, viewports, and overrides fit together
- [**Architecture**](concepts/architecture.md) — how the components fit together

## License

Terranova is released under the [BSD 3-Clause License](https://github.com/esnet/terranova/blob/main/LICENSE).
