# Datasources

A **datasource** is a plugin that fetches network topology data from an external system. Dataset queries specify an endpoint from a configured datasource, and Terranova retrieves the data to populate the dataset's results.

## Built-in datasource: Google Sheets

The only built-in datasource is **Google Sheets**. It reads circuit and topology data from Google Sheets spreadsheets shared with a service account.

Sheets must follow the [Terranova Topology Format](https://docs.google.com/spreadsheets/d/191BuMoWa2CooMXJQzyNtBRlNLHamBmh-8PCoIGDELxA/edit) — a tabular format where each row represents a circuit with columns for source/destination endpoints, location names, coordinates, and other attributes.

Each sheet within a spreadsheet that the service account can access becomes an available **endpoint** in the Dataset Editor.

See [Google Sheets Setup](../deployment/google-sheets-setup.md) for instructions on configuring credentials.

## Caching

Datasource results are cached locally in a SQLite file (one per datasource, path set in `settings.yml`). The cache reduces the number of calls to the upstream system and speeds up dataset queries.

To refresh the cache from the command line:

```sh
make fetch
```

Or via the API (see [Datasources API](../api/datasources.md)).

## Plugin architecture

Datasources are Python packages under `terranova/datasources/`. The `DatasourceRegistry` discovers them automatically at startup by scanning that package for submodules.

Each datasource package must export:

| Export | Description |
|---|---|
| `fetch` | Function to retrieve data from the external system |
| `router` | FastAPI router providing datasource-specific API endpoints |
| `backend` | Object with a `render_topology()` method |
| `configure` | Function called at startup to configure the datasource |
| `metadata` | Metadata about the datasource (name, description, etc.) |

A datasource that does not provide all five exports will fail to load at startup.

## Adding a custom datasource

To add a new datasource, create a Python package at `terranova/datasources/my_datasource/` and implement the five required exports. The datasource will be discovered automatically on the next application restart and its endpoints will appear in the Dataset Editor.

!!! warning
    The datasource plugin API is not yet formally versioned and may change between releases.
