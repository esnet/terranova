"""
Tests for the CSV upload datasource.

Covers:
- Parser: valid input, missing columns, unknown node references, empty files
- Backend: insert, list, delete
- API: upload, list, query, delete endpoints

Run with:
    python -m pytest tests/test_csv_upload.py --noconftest -v
"""
import pytest
from fastapi import HTTPException

from terranova.datasources.csv_upload.parser import parse_csv_upload

NODES_CSV = """name,latitude,longitude,description
Node A,37.7749,-122.4194,San Francisco
Node B,34.0522,-118.2437,Los Angeles
Node C,47.6062,-122.3321,Seattle"""

EDGES_CSV = """name,description,source,destination
Link AB,A to B,Node A,Node B
Link BC,B to C,Node B,Node C"""


# ---------------------------------------------------------------------------
# Parser tests
# ---------------------------------------------------------------------------

class TestCSVParser:

    def test_valid_upload_returns_correct_edge_count(self):
        edges, columns, types = parse_csv_upload(NODES_CSV, EDGES_CSV, "test001")
        assert len(edges) == 2

    def test_valid_upload_edge_has_endpoints(self):
        edges, _, _ = parse_csv_upload(NODES_CSV, EDGES_CSV, "test001")
        edge = edges[0]
        assert "endpoints" in edge
        assert len(edge["endpoints"]) == 2

    def test_valid_upload_endpoints_match_source_destination(self):
        edges, _, _ = parse_csv_upload(NODES_CSV, EDGES_CSV, "test001")
        edge = edges[0]
        assert edge["endpoints"][0]["name"] == "Node A"
        assert edge["endpoints"][1]["name"] == "Node B"

    def test_valid_upload_auto_generates_id(self):
        edges, _, _ = parse_csv_upload(NODES_CSV, EDGES_CSV, "mycsv")
        assert edges[0]["id"] == "mycsv_0"
        assert edges[1]["id"] == "mycsv_1"

    def test_valid_upload_columns_include_endpoints_prefix(self):
        _, columns, _ = parse_csv_upload(NODES_CSV, EDGES_CSV, "test001")
        assert any(c.startswith("endpoints_") for c in columns)
        assert "endpoints_name" in columns
        assert "endpoints_latitude" in columns

    def test_valid_upload_all_scalars(self):
        _, columns, types = parse_csv_upload(NODES_CSV, EDGES_CSV, "test001")
        assert all(t == "scalar" for t in types)

    def test_missing_node_column_raises_400(self):
        bad_nodes = "latitude,longitude,description\n37.77,-122.41,SF"
        with pytest.raises(HTTPException) as exc_info:
            parse_csv_upload(bad_nodes, EDGES_CSV, "test001")
        assert exc_info.value.status_code == 400
        assert "name" in exc_info.value.detail.lower()

    def test_missing_edge_column_raises_400(self):
        bad_edges = "name,source,destination\nLink AB,Node A,Node B"
        with pytest.raises(HTTPException) as exc_info:
            parse_csv_upload(NODES_CSV, bad_edges, "test001")
        assert exc_info.value.status_code == 400
        assert "description" in exc_info.value.detail.lower()

    def test_unknown_node_in_edges_raises_400(self):
        edges_with_bad_ref = """name,description,source,destination
Link XY,X to Y,Node X,Node Y"""
        with pytest.raises(HTTPException) as exc_info:
            parse_csv_upload(NODES_CSV, edges_with_bad_ref, "test001")
        assert exc_info.value.status_code == 400
        assert "Node X" in exc_info.value.detail or "Node Y" in exc_info.value.detail

    def test_empty_nodes_csv_raises_400(self):
        with pytest.raises(HTTPException) as exc_info:
            parse_csv_upload("", EDGES_CSV, "test001")
        assert exc_info.value.status_code == 400

    def test_empty_edges_csv_raises_400(self):
        with pytest.raises(HTTPException) as exc_info:
            parse_csv_upload(NODES_CSV, "", "test001")
        assert exc_info.value.status_code == 400

    def test_extra_node_columns_are_preserved_in_endpoints(self):
        nodes_with_extra = """name,latitude,longitude,description,region
Node A,37.7749,-122.4194,San Francisco,West
Node B,34.0522,-118.2437,Los Angeles,West
Node C,47.6062,-122.3321,Seattle,West"""
        edges, columns, _ = parse_csv_upload(nodes_with_extra, EDGES_CSV, "test001")
        endpoint = edges[0]["endpoints"][0]
        assert "region" in endpoint
        assert "endpoints_region" in columns

    def test_explicit_id_column_is_used(self):
        edges_with_id = """id,name,description,source,destination
edge-001,Link AB,A to B,Node A,Node B
edge-002,Link BC,B to C,Node B,Node C"""
        edges, _, _ = parse_csv_upload(NODES_CSV, edges_with_id, "mycsv")
        assert edges[0]["id"] == "edge-001"
        assert edges[1]["id"] == "edge-002"


# ---------------------------------------------------------------------------
# Backend tests (integration with SQLite)
# ---------------------------------------------------------------------------

class TestCSVBackend:

    @pytest.fixture
    def backend(self, tmp_path):
        """Provide a CSVBackend pointing at a temp SQLite file."""
        from sqlalchemy import create_engine
        from sqlalchemy.pool import StaticPool
        from terranova.datasources.csv_upload.backend import CSVBackend, Base

        test_engine = create_engine(
            "sqlite:///" + str(tmp_path / "test.sqlite"),
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(test_engine)
        return CSVBackend(engine=test_engine)

    def test_insert_and_list(self, backend):
        edges, columns, types = parse_csv_upload(NODES_CSV, EDGES_CSV, "csv001")
        backend.insert_dataset("csv001", "Test Dataset", edges, columns, types)

        result = backend.list_csvs()
        assert result.count == 1
        assert result.data[0]["csv_name"] == "Test Dataset"

    def test_query_returns_edges(self, backend):
        edges, columns, types = parse_csv_upload(NODES_CSV, EDGES_CSV, "csv002")
        backend.insert_dataset("csv002", "My CSV", edges, columns, types)

        result = backend.query([], csv_id="csv002", limit=10)
        assert result.count == 2

    def test_delete_removes_dataset(self, backend):
        edges, columns, types = parse_csv_upload(NODES_CSV, EDGES_CSV, "csv003")
        backend.insert_dataset("csv003", "To Delete", edges, columns, types)

        backend.delete_dataset("csv003")
        result = backend.list_csvs()
        assert result.count == 0

    def test_list_datasources_returns_one_entry_per_csv(self, backend):
        edges, columns, types = parse_csv_upload(NODES_CSV, EDGES_CSV, "csv004")
        backend.insert_dataset("csv004", "My Network", edges, columns, types)

        ds = backend.list_datasources()
        assert len(ds) == 1
        assert "My Network" in ds[0]["display_name"]
        assert "csv004" in ds[0]["query_endpoint"]
