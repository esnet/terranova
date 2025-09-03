def configure():
    """
    This function is part of the module pattern for terranova.
    It is intended to patch any necessary settings onto the terranova settings module.
    the 'settings' module includes a 'config' member that represents the YAML config
    file. Look up each setting from the 'config' dict and provide guidance as necessary
    for settings for your module.
    """
    import yaml
    import json
    from terranova import settings
    from terranova.settings import DATASOURCES

    DEFAULT_CONFIG = """
    google_sheets:
        # credential_type: either 'static' or 'dynamic'.
        # 'static' loads service account JWTs from a config file
            # (see: static.token_files)
        # 'dynamic' encrypts, stores, and loads JWTs from Elastic.
            # (see: dynamic)
        credential_type: static
        cache_file: /var/tmp/google_sheets.sqlite
        static:
            token_files:
                # these are provisioned by creating a service account,
                # and then creating a JWT credential for it.
                - /private/path/to/google_jwt.json
                - /private/another/path/to/google_jwt.json
        dynamic:
            # replace this with a long secret string.
            # This is unnecessary if credential_type == 'static'
            encryption_key: YOURLONGSECRETSTRINGHERE
            # it's common for the read vs write index names
            # to differ in ElasticSearch,
            # but sometimes these will be the same.
            elastic_read_index: sheets-tokens-*
            elastic_write_index: sheets-tokens
    """

    GOOGLE_SHEETS = DATASOURCES.get("google_sheets")

    if GOOGLE_SHEETS is None:
        raise RuntimeError(
            "Please provide a google sheets configuration, under 'datasources'.\n\nDefault:\n%s"
            % DEFAULT_CONFIG
        )

    settings.GOOGLE_SHEETS_CACHE_FILE = GOOGLE_SHEETS.get("cache_file", "google_sheets.sqlite")

    settings.GOOGLE_SHEETS_TABLE_NAME = GOOGLE_SHEETS.get("table_name", "sheets")
    settings.GOOGLE_SHEETS_META_TABLE_NAME = GOOGLE_SHEETS.get(
        "metadata_table_name", "sheet_metadata"
    )

    # # either 'static' (sourced from env vars) or 'dynamic' (AES-256 encrypted and ES-backed)
    settings.GOOGLE_SHEETS_CREDENTIAL_SOURCE = GOOGLE_SHEETS.get("credential_type", "static")

    settings.GOOGLE_SHEETS_ENCRYPTION_KEY = GOOGLE_SHEETS.get("encryption_key")

    settings.GOOGLE_SHEETS_READ_INDEX = GOOGLE_SHEETS.get("dynamic", {}).get("elastic_read_index")
    settings.GOOGLE_SHEETS_WRITE_INDEX = GOOGLE_SHEETS.get("dynamic", {}).get(
        "elastic_write_index"
    )

    if settings.GOOGLE_SHEETS_CREDENTIAL_SOURCE == "dynamic":
        if (
            settings.GOOGLE_SHEETS_ENCRYPTION_KEY is None
            or settings.GOOGLE_SHEETS_ENCRYPTION_KEY == "YOURLONGSECRETSTRINGHERE"
        ):
            raise RuntimeError(
                "Misconfiguration in google_sheets.dynamic.encryption_key. "
                "Please provide a encryption key for AES-256 encryption for "
                "credential storage.\n\nCurrent Configuration:\n%s"
                % (yaml.safe_dump({"google_sheets": GOOGLE_SHEETS}))
            )
        if settings.GOOGLE_SHEETS_READ_INDEX is None:
            raise RuntimeError(
                "Misconfiguration in google_sheets.dynamic.elastic_read_index. "
                "Please provide an ElasticSearch/OpenSearch index name "
                "for credential retrieval.\n\nCurrent Configuration:\n%s"
                % (yaml.safe_dump({"google_sheets": GOOGLE_SHEETS}))
            )
        if settings.GOOGLE_SHEETS_WRITE_INDEX is None:
            raise RuntimeError(
                "Misconfiguration in google_sheets.dynamic.elastic_write_index. "
                "Please provide an ElasticSearch/OpenSearch index name for "
                "credential storage.\n\nCurrent Configuration:\n%s"
                % (yaml.safe_dump({"google_sheets": GOOGLE_SHEETS}))
            )

    GOOGLE_SHEETS_STATIC = GOOGLE_SHEETS.get("static")
    settings.GOOGLE_SHEETS_TOKEN_FILES = GOOGLE_SHEETS_STATIC.get("token_files")

    if settings.GOOGLE_SHEETS_CREDENTIAL_SOURCE == "static" and GOOGLE_SHEETS_STATIC is None:
        raise RuntimeError(
            "Misconfiguration in google_sheets.static. "
            "This should contain settings for token_files if "
            "google_sheets.credential_type is 'static'\n\nCurrent Configuration:\n%s"
            % (yaml.safe_dump({"google_sheets": GOOGLE_SHEETS}))
        )

    if (
        settings.GOOGLE_SHEETS_CREDENTIAL_SOURCE == "static"
        and settings.GOOGLE_SHEETS_TOKEN_FILES is None
    ):
        raise RuntimeError(
            "Misconfiguration in google_sheets.static.token_files. "
            "This should be a list of file paths if "
            "google_sheets.credential_type is 'static'\n\nCurrent Configuration:\n%s"
            % (yaml.safe_dump({"google_sheets": GOOGLE_SHEETS}))
        )

    settings.GOOGLE_SHEETS_CREDENTIALS = []

    for jwt_path in settings.GOOGLE_SHEETS_TOKEN_FILES:
        try:
            with open(jwt_path, "r") as fh:
                settings.GOOGLE_SHEETS_CREDENTIALS.append(json.load(fh))
        except (FileNotFoundError, PermissionError):
            raise RuntimeError(
                "File not found or not readable: %s\n\nCurrent Configuration:\n%s"
                % (jwt_path, yaml.safe_dump({"google_sheets": GOOGLE_SHEETS}))
            )
        except json.decoder.JSONDecodeError:
            raise RuntimeError(
                "File does not contain valid JSON: %s\n\nCurrent Configuration:\n%s"
                % (jwt_path, yaml.safe_dump({"google_sheets": GOOGLE_SHEETS}))
            )


METADATA = {
    "nickname": "sheets_edge",
    "nickname_plural": "sheets_edges",
    "display_name": "Google Sheets Edges",
    "distinct_values_endpoint": "/sheets/{sheet_id}/distinct",
    "query_endpoint": "/sheets/{sheet_id}/edges",
    "filterable_columns_endpoint": "/sheets/{sheet_id}/filterable_columns",
    "variable": "sheet_id",
    "variable_source": "/sheets/",
}
