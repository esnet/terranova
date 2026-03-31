# Datasources API

Endpoints for discovering available datasource endpoints. These are used by the Dataset Editor to populate the endpoint dropdown.

## List datasource metadata

```
GET /api/v1/datasources/
```

Returns metadata about all configured datasources and their available endpoints. No authentication required.

**Response:** A JSON object keyed by endpoint string. Each value is a metadata object describing the datasource endpoint.

For Google Sheets, each accessible spreadsheet/sheet combination becomes a separate entry. The endpoint string format is:

```
google_sheets?sheet_id=<sheet_id>&sheet_name=<sheet_name>
```

**Example response:**

```json
{
  "google_sheets?sheet_id=abc123&sheet_name=Circuits": {
    "name": "Circuits",
    "description": "Circuit topology from the Circuits sheet",
    "context": {
      "sheet_id": "abc123",
      "sheet_name": "Circuits"
    }
  }
}
```

The endpoint string is used as the `query.endpoint` value when creating or updating a dataset.
