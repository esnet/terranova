import csv
import io
from collections import defaultdict
from fastapi import HTTPException

REQUIRED_NODE_COLUMNS = {"name", "latitude", "longitude", "description"}
REQUIRED_EDGE_COLUMNS = {"name", "description", "source", "destination"}


def fetch():
    """No-op. CSV data arrives via POST upload, not periodic fetch."""
    pass


def parse_csv_upload(
    nodes_content: str,
    edges_content: str,
    csv_id: str,
) -> tuple[list[dict], list[str], list[str]]:
    """
    Parse uploaded CSV content into edge documents.

    Returns (edges, columns, types) where:
      - edges: list of edge dicts ready for SQLite storage
      - columns: list of column names for filtering (edge + endpoints_* prefixed node columns)
      - types: list of "scalar" or "array" per column
    """
    nodes = _parse_nodes(nodes_content)
    edges, edge_columns, edge_types, node_columns, node_types = _parse_edges(
        edges_content, nodes, csv_id
    )

    # Combine edge columns with endpoints_* prefixed node columns (same as Google Sheets)
    all_columns = edge_columns + ["endpoints_" + c for c in node_columns]
    all_types = edge_types + node_types

    return edges, all_columns, all_types


def _parse_nodes(nodes_content: str) -> dict:
    """Parse nodes CSV, return {name: node_dict}."""
    try:
        reader = csv.DictReader(io.StringIO(nodes_content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse Nodes CSV: {e}")

    if reader.fieldnames is None:
        raise HTTPException(status_code=400, detail="Nodes CSV is empty or has no header row.")

    # Validate required columns (case-insensitive)
    header_lower = {f.lower() for f in reader.fieldnames}
    missing = REQUIRED_NODE_COLUMNS - header_lower
    if missing:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Nodes CSV is missing required columns: {', '.join(sorted(missing))}. "
                f"Required: {', '.join(sorted(REQUIRED_NODE_COLUMNS))}."
            ),
        )

    # Build a case-insensitive field name map
    field_map = {f.lower(): f for f in reader.fieldnames}

    nodes = {}
    for row in reader:
        # Normalize keys to lowercase
        normalized = {k.lower(): v for k, v in row.items()}
        name = normalized.get("name", "").strip()
        if not name:
            continue
        node = {k: v for k, v in normalized.items()}
        nodes[name] = node

    if not nodes:
        raise HTTPException(status_code=400, detail="Nodes CSV contains no data rows.")

    return nodes


def _parse_edges(
    edges_content: str,
    nodes: dict,
    csv_id: str,
) -> tuple[list[dict], list[str], list[str], list[str], list[str]]:
    """
    Parse edges CSV, resolve source/destination to node dicts.
    Returns (edges, edge_columns, edge_types, node_columns, node_types).
    """
    try:
        reader = csv.DictReader(io.StringIO(edges_content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse Edges CSV: {e}")

    if reader.fieldnames is None:
        raise HTTPException(status_code=400, detail="Edges CSV is empty or has no header row.")

    header_lower = {f.lower() for f in reader.fieldnames}
    missing = REQUIRED_EDGE_COLUMNS - header_lower
    if missing:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Edges CSV is missing required columns: {', '.join(sorted(missing))}. "
                f"Required: {', '.join(sorted(REQUIRED_EDGE_COLUMNS))}."
            ),
        )

    # Detect column types: track how many times each column name appears
    column_counts = defaultdict(int)
    for f in reader.fieldnames:
        column_counts[f.lower()] += 1

    edge_columns = [f.lower() for f in reader.fieldnames]
    edge_types = ["array" if column_counts[c] > 1 else "scalar" for c in edge_columns]

    # Derive node column names and types from the nodes dict keys
    sample_node = next(iter(nodes.values())) if nodes else {}
    node_columns = list(sample_node.keys())
    node_types = ["scalar"] * len(node_columns)

    edges = []
    unknown_nodes = set()

    for row_index, row in enumerate(reader):
        normalized = {k.lower(): v for k, v in row.items()}

        source_name = normalized.get("source", "").strip()
        dest_name = normalized.get("destination", "").strip()

        if source_name not in nodes:
            unknown_nodes.add(source_name)
        if dest_name not in nodes:
            unknown_nodes.add(dest_name)

        if unknown_nodes:
            continue  # collect all unknown nodes before raising

        source_node = nodes[source_name]
        dest_node = nodes[dest_name]

        edge_id = normalized.get("id") or f"{csv_id}_{row_index}"

        edge = {
            "id": edge_id,
            "name": normalized.get("name", ""),
            "description": normalized.get("description", ""),
            "source": source_name,
            "destination": dest_name,
            "endpoints": [source_node, dest_node],
        }

        # Attach extra columns as metadata
        for col in edge_columns:
            if col not in {"id", "name", "description", "source", "destination"}:
                edge[col] = normalized.get(col)

        edges.append(edge)

    if unknown_nodes:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Edges CSV references node(s) not found in Nodes CSV: "
                f"{', '.join(sorted(unknown_nodes))}. "
                f"Check that Source and Destination values match names in the Nodes CSV."
            ),
        )

    if not edges:
        raise HTTPException(status_code=400, detail="Edges CSV contains no data rows.")

    return edges, edge_columns, edge_types, node_columns, node_types
