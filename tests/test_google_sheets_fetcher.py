"""
Tests for terranova.datasources.google_sheets.fetcher.

Google API calls are fully mocked; no credentials or network access required.
The harness drives fetch() with controlled sheet data to verify row-processing
logic, including edge cases like missing nodes.
"""
import pytest
from unittest.mock import patch, MagicMock, call
from collections import defaultdict


# ---------------------------------------------------------------------------
# Helpers to build mock Google API responses
# ---------------------------------------------------------------------------

def _make_drive_service(sheets):
    """
    Return a mock for the Drive v3 service.
    `sheets` is a list of dicts with keys 'id' and 'name'.
    """
    svc = MagicMock()
    svc.files.return_value.list.return_value.execute.return_value = {"files": sheets}
    return svc


def _make_sheets_service(values_by_range):
    """
    Return a mock for the Sheets v4 service.
    `values_by_range` maps range strings to lists-of-lists (the sheet rows).
    Pass an Exception instance as a value to simulate HttpError for that range.
    """
    from googleapiclient.errors import HttpError

    def _get_side_effect(**kwargs):
        rng = kwargs.get("range", "")
        val = values_by_range.get(rng)
        mock = MagicMock()
        if isinstance(val, Exception):
            mock.execute.side_effect = val
        else:
            mock.execute.return_value = {"values": val}
        return mock

    svc = MagicMock()
    svc.spreadsheets.return_value.values.return_value.get.side_effect = (
        lambda **kwargs: _get_side_effect(**kwargs)
    )
    return svc


def _build_factory(drive_svc, sheets_svc):
    """
    Return a side-effect function for patching googleapiclient.discovery.build.
    Returns the drive service when asked for 'drive', sheets service for 'sheets'.
    """
    def _build(api, version, **kwargs):
        if api == "drive":
            return drive_svc
        return sheets_svc
    return _build


# ---------------------------------------------------------------------------
# Standard sheet data fixtures
# ---------------------------------------------------------------------------

NODES_ROWS = [
    ["name", "latitude", "longitude", "description"],
    ["NYC", "40.7128", "-74.0060", "New York"],
    ["LAX", "33.9425", "-118.4081", "Los Angeles"],
]

EDGES_ROWS = [
    ["name", "source", "destination", "description"],
    ["NYC-LAX", "NYC", "LAX", "Backbone link"],
]

EDGES_WITH_MISSING_NODE = [
    ["name", "source", "destination", "description"],
    ["NYC-SC", "NYC", "SC", "Link to unknown node"],
    ["NYC-LAX", "NYC", "LAX", "Normal link"],
]


# ---------------------------------------------------------------------------
# Shared patch context
# ---------------------------------------------------------------------------

FAKE_TOKEN = {"type": "service_account", "project_id": "fake"}


def _run_fetch(sheets_list, nodes_rows, edges_rows):
    """
    Run fetch() with mocked Google API returning the given sheet data.
    Returns (output, sheet_metadata) or raises.
    """
    from terranova.datasources.google_sheets.fetcher import fetch

    sheet_id = sheets_list[0]["id"]
    drive_svc = _make_drive_service(sheets_list)
    sheets_svc = _make_sheets_service({
        "Nodes!A:Z": nodes_rows,
        "Edges!A:Z": edges_rows,
    })

    mock_creds = MagicMock()
    mock_creds.valid = True

    with patch("terranova.datasources.google_sheets.fetcher.enumerate_credentials",
               return_value=[FAKE_TOKEN]), \
         patch("terranova.datasources.google_sheets.fetcher.service_account"
               ".Credentials.from_service_account_info", return_value=mock_creds), \
         patch("terranova.datasources.google_sheets.fetcher.build",
               side_effect=_build_factory(drive_svc, sheets_svc)):
        return fetch()


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_fetch_basic():
    """
    fetch() returns edges for a well-formed sheet with matching nodes and edges.
    """
    sheets = [{"id": "sheet1", "name": "Test Sheet"}]
    result, metadata = _run_fetch(sheets, NODES_ROWS, EDGES_ROWS)

    assert "sheet1" in result
    edges = result["sheet1"]
    assert len(edges) == 1
    edge = edges[0]
    assert edge["name"] == "NYC-LAX"
    endpoints = edge["endpoints"]
    assert endpoints[0]["name"] == "NYC"
    assert endpoints[1]["name"] == "LAX"


def test_fetch_node_coordinates_preserved():
    """
    Node latitude/longitude values from the sheet are present on endpoints.
    """
    sheets = [{"id": "sheet1", "name": "Test Sheet"}]
    result, _ = _run_fetch(sheets, NODES_ROWS, EDGES_ROWS)

    edge = result["sheet1"][0]
    nyc = edge["endpoints"][0]
    assert nyc["latitude"] == "40.7128"
    assert nyc["longitude"] == "-74.0060"


def test_fetch_missing_node_creates_placeholder():
    """
    Regression: when an edge references a node not present in the Nodes sheet,
    fetch() previously raised KeyError. Now it should create a placeholder node
    at latitude=0, longitude=0 and continue processing remaining edges.
    """
    sheets = [{"id": "sheet1", "name": "Test Sheet"}]
    result, _ = _run_fetch(sheets, NODES_ROWS, EDGES_WITH_MISSING_NODE)

    edges = result["sheet1"]
    # Both edges should be present — the missing-node one should not be dropped
    assert len(edges) == 2

    missing_edge = next(e for e in edges if e["name"] == "NYC-SC")
    sc_node = missing_edge["endpoints"][1]
    assert sc_node["name"] == "SC"
    assert sc_node["latitude"] == 0
    assert sc_node["longitude"] == 0

    # The normal edge should still resolve correctly
    normal_edge = next(e for e in edges if e["name"] == "NYC-LAX")
    assert normal_edge["endpoints"][1]["name"] == "LAX"


def test_fetch_missing_node_does_not_affect_known_nodes():
    """
    Creating a placeholder for an unknown node must not overwrite
    or corrupt a known node with the same name in a subsequent lookup.
    """
    sheets = [{"id": "sheet1", "name": "Test Sheet"}]
    # Edge sheet references NYC (known) and SC (unknown), then NYC again
    edges_rows = [
        ["name", "source", "destination", "description"],
        ["A", "NYC", "SC", "first"],
        ["B", "SC", "NYC", "second"],
    ]
    result, _ = _run_fetch(sheets, NODES_ROWS, edges_rows)

    edges = result["sheet1"]
    # NYC should retain its real coordinates on both edges
    nyc_in_a = edges[0]["endpoints"][0]
    nyc_in_b = edges[1]["endpoints"][1]
    assert nyc_in_a["latitude"] == "40.7128"
    assert nyc_in_b["latitude"] == "40.7128"


def test_fetch_multiple_sheets():
    """
    fetch() processes multiple sheets independently and returns edges for each.
    """
    sheets = [
        {"id": "sheet1", "name": "Sheet One"},
        {"id": "sheet2", "name": "Sheet Two"},
    ]
    from terranova.datasources.google_sheets.fetcher import fetch

    mock_creds = MagicMock()
    mock_creds.valid = True

    drive_svc = _make_drive_service(sheets)
    sheets_svc = _make_sheets_service({
        "Nodes!A:Z": NODES_ROWS,
        "Edges!A:Z": EDGES_ROWS,
    })

    with patch("terranova.datasources.google_sheets.fetcher.enumerate_credentials",
               return_value=[FAKE_TOKEN]), \
         patch("terranova.datasources.google_sheets.fetcher.service_account"
               ".Credentials.from_service_account_info", return_value=mock_creds), \
         patch("terranova.datasources.google_sheets.fetcher.build",
               side_effect=_build_factory(drive_svc, sheets_svc)):
        result, metadata = fetch()

    assert "sheet1" in result
    assert "sheet2" in result
    assert len(result["sheet1"]) == 1
    assert len(result["sheet2"]) == 1


def test_fetch_malformed_sheet_skipped():
    """
    When a sheet raises HttpError on the Nodes range (malformed format),
    that sheet is skipped and fetch() continues without crashing.
    """
    from terranova.datasources.google_sheets.fetcher import fetch
    from googleapiclient.errors import HttpError
    from unittest.mock import patch

    sheets = [
        {"id": "bad_sheet", "name": "Bad Sheet"},
        {"id": "good_sheet", "name": "Good Sheet"},
    ]

    mock_creds = MagicMock()
    mock_creds.valid = True

    drive_svc = _make_drive_service(sheets)

    http_error = HttpError(resp=MagicMock(status=400), content=b"bad request")
    sheets_svc = _make_sheets_service({
        # bad_sheet raises on nodes fetch; good_sheet is fine
        "Nodes!A:Z": http_error,
        "Edges!A:Z": EDGES_ROWS,
    })

    with patch("terranova.datasources.google_sheets.fetcher.enumerate_credentials",
               return_value=[FAKE_TOKEN]), \
         patch("terranova.datasources.google_sheets.fetcher.service_account"
               ".Credentials.from_service_account_info", return_value=mock_creds), \
         patch("terranova.datasources.google_sheets.fetcher.build",
               side_effect=_build_factory(drive_svc, sheets_svc)):
        result, _ = fetch()

    # good_sheet has no edges because nodes failed so endpoints can't resolve —
    # but fetch() should not raise at all
    assert isinstance(result, dict)


def test_fetch_no_sheets_returns_none():
    """
    When the Drive API returns an empty file list, fetch() returns None
    (the early-return path).
    """
    from terranova.datasources.google_sheets.fetcher import fetch

    mock_creds = MagicMock()
    mock_creds.valid = True

    drive_svc = _make_drive_service([])  # no sheets
    sheets_svc = _make_sheets_service({})

    with patch("terranova.datasources.google_sheets.fetcher.enumerate_credentials",
               return_value=[FAKE_TOKEN]), \
         patch("terranova.datasources.google_sheets.fetcher.service_account"
               ".Credentials.from_service_account_info", return_value=mock_creds), \
         patch("terranova.datasources.google_sheets.fetcher.build",
               side_effect=_build_factory(drive_svc, sheets_svc)):
        result = fetch()

    assert result is None


def test_fetch_metadata_includes_columns():
    """
    sheet_metadata returned by fetch() includes column names derived
    from the edge sheet headers plus endpoint_ prefixed node columns.
    """
    sheets = [{"id": "sheet1", "name": "Test Sheet"}]
    _, metadata = _run_fetch(sheets, NODES_ROWS, EDGES_ROWS)

    cols = metadata["sheet1"]["columns"]
    # Edge columns
    assert "name" in cols
    assert "source" in cols
    assert "destination" in cols
    # Node columns prefixed with endpoints_
    assert any(c.startswith("endpoints_") for c in cols)
