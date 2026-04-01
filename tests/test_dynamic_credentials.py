"""
Tests for dynamic credential mode.

Verifies that:
- configure() works with credential_type=dynamic and no 'static' section in config
- SQLiteBackend.create() auto-creates tables for credential storage
- SQLiteBackend.query() returns empty results for non-existent tables
- SQLiteBackend.delete_by_query() is safe on non-existent tables
"""

import json
import pytest
import tempfile
import os
from unittest.mock import patch

from terranova.backends.sqlite import SQLiteBackend


DYNAMIC_CONFIG = {
    "google_sheets": {
        "credential_type": "dynamic",
        "cache_file": "/tmp/test_google_sheets.sqlite",
        # encryption_key is read from the top level by configure()
        "encryption_key": "a" * 64,
        "dynamic": {
            "elastic_read_index": "sheets_tokens",
            "elastic_write_index": "sheets_tokens",
        },
        # Note: no 'static' section — this was the crasher
    }
}


def test_configure_dynamic_mode_no_static_section():
    """configure() must not crash when credential_type=dynamic and there is no 'static' section"""
    with patch("terranova.settings.DATASOURCES", DYNAMIC_CONFIG):
        from terranova.datasources.google_sheets.settings import configure
        # Should complete without AttributeError or RuntimeError
        configure()


def test_token_files_empty_in_dynamic_mode():
    """GOOGLE_SHEETS_TOKEN_FILES must be falsy in dynamic mode (no files to open)"""
    from terranova import settings as tn_settings

    with patch("terranova.settings.DATASOURCES", DYNAMIC_CONFIG):
        from terranova.datasources.google_sheets.settings import configure
        configure()

    assert not tn_settings.GOOGLE_SHEETS_TOKEN_FILES


def test_credentials_list_empty_in_dynamic_mode():
    """GOOGLE_SHEETS_CREDENTIALS must be an empty list in dynamic mode"""
    from terranova import settings as tn_settings

    with patch("terranova.settings.DATASOURCES", DYNAMIC_CONFIG):
        from terranova.datasources.google_sheets.settings import configure
        configure()

    assert tn_settings.GOOGLE_SHEETS_CREDENTIALS == []


class TestSQLiteCredentialStorage:
    """Test SQLite backend behaviour used for dynamic credential storage"""

    @pytest.fixture
    def backend(self):
        temp_fd, temp_path = tempfile.mkstemp(suffix=".db")
        os.close(temp_fd)
        b = SQLiteBackend(db_path=temp_path)
        yield b
        if hasattr(b, "_local") and hasattr(b._local, "conn"):
            b._local.conn.close()
        if os.path.exists(temp_path):
            os.remove(temp_path)

    def test_create_auto_creates_credential_table(self, backend):
        """create() must work for tables not pre-created in create_indices()"""
        result = backend.create(
            "sheets_tokens", "my-project-id", {"name": "my-sa", "jwt": "encrypted-blob"}
        )
        assert result["result"] == "created"

    def test_query_returns_stored_credential(self, backend):
        """After create(), query() must return the stored credential"""
        backend.create(
            "sheets_tokens", "proj-1", {"name": "proj-1", "jwt": "enc"}
        )
        query = {"bool": {"filter": [{"term": {"name": "proj-1"}}]}}
        results = backend.query("sheets_tokens", query)
        assert len(results) == 1
        assert results[0]["name"] == "proj-1"

    def test_query_empty_before_any_writes(self, backend):
        """query() on a table that has never been written returns an empty list"""
        results = backend.query("sheets_tokens", {"bool": {"filter": []}})
        assert results == []

    def test_delete_by_query_on_missing_table(self, backend):
        """delete_by_query() on a table that has never been written returns deleted=0"""
        result = backend.delete_by_query(
            "sheets_tokens", {"bool": {"filter": []}}, max_docs=1
        )
        assert result["deleted"] == 0

    def test_multiple_credentials_stored_independently(self, backend):
        """Multiple credentials can be stored and retrieved independently"""
        backend.create("sheets_tokens", "proj-a", {"name": "proj-a", "jwt": "enc-a"})
        backend.create("sheets_tokens", "proj-b", {"name": "proj-b", "jwt": "enc-b"})

        all_query = {"bool": {"filter": []}}
        results = backend.query("sheets_tokens", all_query)
        assert len(results) == 2
        names = {r["name"] for r in results}
        assert names == {"proj-a", "proj-b"}


class TestDecryptCredential:
    """Test round-trip encryption/decryption of Google Sheets credentials"""

    SAMPLE_JWT = json.dumps({
        "type": "service_account",
        "project_id": "my-gcp-project",
        "private_key_id": "abc123",
        "private_key": "-----BEGIN RSA PRIVATE KEY-----\nfake\n-----END RSA PRIVATE KEY-----\n",
        "client_email": "sa@my-gcp-project.iam.gserviceaccount.com",
        "client_id": "123456789",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/sa",
    })

    def test_decrypt_credential_roundtrip(self):
        """create_credential then decrypt_credential returns the original JWT data"""
        import tempfile, os
        from unittest.mock import patch

        with tempfile.NamedTemporaryFile(suffix=".sqlite", delete=False) as f:
            db_path = f.name
        try:
            with patch("terranova.settings.DATASOURCES", DYNAMIC_CONFIG), \
                 patch("terranova.settings.GOOGLE_SHEETS_ENCRYPTION_KEY", "a" * 64):
                from terranova.datasources.google_sheets.settings import configure
                configure()
                from terranova.datasources.google_sheets.backend import GoogleSheetsBackend
                from terranova.backends.sqlite import SQLiteBackend
                storage = SQLiteBackend(db_path=db_path)
                with patch("terranova.datasources.google_sheets.backend.storage_backend", storage), \
                     patch("terranova.datasources.google_sheets.backend.GOOGLE_SHEETS_ENCRYPTION_KEY", "a" * 64), \
                     patch("terranova.datasources.google_sheets.backend.GOOGLE_SHEETS_WRITE_INDEX", "sheets_tokens"), \
                     patch("terranova.datasources.google_sheets.backend.GOOGLE_SHEETS_READ_INDEX", "sheets_tokens"):
                    gs = GoogleSheetsBackend()
                    gs.create_credential("my-gcp-project", self.SAMPLE_JWT)
                    result = gs.list_credentials(sanitize=False)
                    assert result.count == 1
                    decrypted = result.data[0]
                    assert decrypted["project_id"] == "my-gcp-project"
                    assert decrypted["type"] == "service_account"
        finally:
            os.unlink(db_path)

    def test_stored_credential_is_not_plaintext(self):
        """The jwt field in the DB must not contain the plaintext private key"""
        import tempfile, os
        from unittest.mock import patch

        with tempfile.NamedTemporaryFile(suffix=".sqlite", delete=False) as f:
            db_path = f.name
        try:
            with patch("terranova.settings.DATASOURCES", DYNAMIC_CONFIG), \
                 patch("terranova.settings.GOOGLE_SHEETS_ENCRYPTION_KEY", "a" * 64):
                from terranova.datasources.google_sheets.settings import configure
                configure()
                from terranova.datasources.google_sheets.backend import GoogleSheetsBackend
                from terranova.backends.sqlite import SQLiteBackend
                storage = SQLiteBackend(db_path=db_path)
                with patch("terranova.datasources.google_sheets.backend.storage_backend", storage), \
                     patch("terranova.datasources.google_sheets.backend.GOOGLE_SHEETS_ENCRYPTION_KEY", "a" * 64), \
                     patch("terranova.datasources.google_sheets.backend.GOOGLE_SHEETS_WRITE_INDEX", "sheets_tokens"), \
                     patch("terranova.datasources.google_sheets.backend.GOOGLE_SHEETS_READ_INDEX", "sheets_tokens"):
                    gs = GoogleSheetsBackend()
                    gs.create_credential("my-gcp-project", self.SAMPLE_JWT)
                    rows = storage.query("sheets_tokens", {"bool": {"filter": []}})
                    assert len(rows) == 1
                    raw_jwt = rows[0]["jwt"]
                    # Must not contain the private key in plaintext
                    assert "BEGIN RSA PRIVATE KEY" not in raw_jwt
                    assert "my-gcp-project" not in raw_jwt
        finally:
            os.unlink(db_path)
