METADATA = {
    "nickname": "csv_edge",
    "nickname_plural": "csv_edges",
    "display_name": "CSV Uploads",
    "distinct_values_endpoint": "/csv/{csv_id}/distinct",
    "query_endpoint": "/csv/{csv_id}/edges",
    "filterable_columns_endpoint": "/csv/{csv_id}/filterable_columns",
    "variable": "csv_id",
    "variable_source": "/csv/",
}

EXAMPLE_SHEET_URL = (
    "https://docs.google.com/spreadsheets/d/"
    "191BuMoWa2CooMXJQzyNtBRlNLHamBmh-8PCoIGDELxA/edit"
)


def configure():
    """
    Patch CSV upload settings onto the terranova settings module.
    All settings have sensible defaults so the csv_upload block in
    settings.yml is entirely optional.

    Example settings.yml entry:
        datasources:
          csv_upload:
            cache_file: /var/tmp/csv_upload.sqlite
            table_name: csv_edges
            metadata_table_name: csv_metadata
    """
    from terranova import settings
    from terranova.settings import DATASOURCES

    CSV_UPLOAD = DATASOURCES.get("csv_upload", {})

    settings.CSV_UPLOAD_CACHE_FILE = CSV_UPLOAD.get(
        "cache_file", "/var/tmp/csv_upload.sqlite"
    )
    settings.CSV_UPLOAD_TABLE_NAME = CSV_UPLOAD.get("table_name", "csv_edges")
    settings.CSV_UPLOAD_META_TABLE_NAME = CSV_UPLOAD.get(
        "metadata_table_name", "csv_metadata"
    )
