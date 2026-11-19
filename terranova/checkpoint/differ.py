"""
Utilities for comparing two dataset result sets.

Both backends store query results as List[Any] where each element is a dict
representing a node or edge record. Records are keyed by a stable identifier
field (e.g. "endpoint_id", "name", or a compound of src+dst for edges).
"""
import hashlib
import json
from typing import Any


# Fields tried in order to find a stable record identifier
_NODE_ID_FIELDS = ["endpoint_id", "node_id", "name", "id"]
_EDGE_ID_FIELDS = ["src", "dst"]  # combined as "src->dst"


def canonical_json(data: Any) -> str:
    """Stable JSON serialisation — sorted keys, no whitespace."""
    return json.dumps(data, sort_keys=True, default=str)


def hash_results(results: list) -> str:
    """SHA-256 of the canonical JSON of a result list, order-independent."""
    sorted_results = sorted(results, key=lambda r: canonical_json(r))
    payload = canonical_json(sorted_results)
    return hashlib.sha256(payload.encode()).hexdigest()


def _record_key(record: dict, id_fields: list[str], fallback_fields: list[str] | None = None) -> str:
    for field in id_fields:
        if field in record:
            return str(record[field])
    if fallback_fields:
        parts = [str(record[f]) for f in fallback_fields if f in record]
        if parts:
            return "->".join(parts)
    # last resort: hash the whole record
    return hash_results([record])


def _edge_key(record: dict) -> str:
    src = record.get("src", "")
    dst = record.get("dst", "")
    return f"{src}->{dst}"


def _classify_records(
    prev: list[dict], curr: list[dict], id_fields: list[str],
    fallback_fields: list[str] | None = None, key_fn=None,
) -> dict:
    _key = key_fn if key_fn else lambda r: _record_key(r, id_fields, fallback_fields)
    prev_by_key = {_key(r): r for r in prev}
    curr_by_key = {_key(r): r for r in curr}

    prev_keys = set(prev_by_key)
    curr_keys = set(curr_by_key)

    added = [curr_by_key[k] for k in curr_keys - prev_keys]
    removed = [prev_by_key[k] for k in prev_keys - curr_keys]
    modified = []
    for k in prev_keys & curr_keys:
        if canonical_json(prev_by_key[k]) != canonical_json(curr_by_key[k]):
            modified.append({"before": prev_by_key[k], "after": curr_by_key[k]})

    return {"added": added, "removed": removed, "modified": modified}


def compute_delta(prev_results: list, curr_results: list) -> dict:
    """
    Compare two dataset result lists and return a structured delta.

    Returns a dict with:
      changed (bool), nodes (added/removed/modified), edges (added/removed/modified), summary (str)
    """
    prev = prev_results or []
    curr = curr_results or []

    # Quick equality check
    if hash_results(prev) == hash_results(curr):
        return {
            "changed": False,
            "nodes": {"added": [], "removed": [], "modified": []},
            "edges": {"added": [], "removed": [], "modified": []},
            "summary": "No changes detected",
        }

    # Heuristic split: records with src/dst look like edges, others look like nodes
    prev_nodes = [r for r in prev if not ("src" in r and "dst" in r)]
    prev_edges = [r for r in prev if "src" in r and "dst" in r]
    curr_nodes = [r for r in curr if not ("src" in r and "dst" in r)]
    curr_edges = [r for r in curr if "src" in r and "dst" in r]

    node_diff = _classify_records(prev_nodes, curr_nodes, _NODE_ID_FIELDS)
    edge_diff = _classify_records(
        prev_edges, curr_edges, id_fields=[], fallback_fields=None,
        key_fn=_edge_key,
    )

    parts = []
    for label, diff in [("node", node_diff), ("edge", edge_diff)]:
        if diff["added"]:
            parts.append(f"{len(diff['added'])} {label}{'s' if len(diff['added']) != 1 else ''} added")
        if diff["removed"]:
            parts.append(f"{len(diff['removed'])} {label}{'s' if len(diff['removed']) != 1 else ''} removed")
        if diff["modified"]:
            parts.append(f"{len(diff['modified'])} {label}{'s' if len(diff['modified']) != 1 else ''} modified")

    summary = ", ".join(parts) if parts else "Data changed (records unclassifiable)"

    return {
        "changed": True,
        "nodes": node_diff,
        "edges": edge_diff,
        "summary": summary,
    }
