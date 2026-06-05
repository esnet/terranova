import pytest
from terranova.checkpoint.differ import hash_results, compute_delta, canonical_json


NODES = [
    {"endpoint_id": "SEA", "name": "Seattle", "lat": 47.6, "lng": -122.3},
    {"endpoint_id": "LAX", "name": "Los Angeles", "lat": 34.0, "lng": -118.2},
    {"endpoint_id": "CHI", "name": "Chicago", "lat": 41.8, "lng": -87.6},
]

EDGES = [
    {"src": "SEA", "dst": "LAX", "capacity": 100},
    {"src": "LAX", "dst": "CHI", "capacity": 200},
]


class TestHashResults:
    def test_identical_results_same_hash(self):
        assert hash_results(NODES) == hash_results(NODES)

    def test_reordered_results_same_hash(self):
        reordered = list(reversed(NODES))
        assert hash_results(NODES) == hash_results(reordered)

    def test_different_results_different_hash(self):
        modified = NODES[:2]
        assert hash_results(NODES) != hash_results(modified)

    def test_empty_list_is_stable(self):
        assert hash_results([]) == hash_results([])

    def test_empty_vs_nonempty_differ(self):
        assert hash_results([]) != hash_results(NODES)


class TestComputeDelta:
    def test_no_change(self):
        delta = compute_delta(NODES, NODES)
        assert delta["changed"] is False
        assert delta["nodes"]["added"] == []
        assert delta["nodes"]["removed"] == []
        assert "No changes" in delta["summary"]

    def test_no_change_reordered(self):
        delta = compute_delta(NODES, list(reversed(NODES)))
        assert delta["changed"] is False

    def test_node_added(self):
        new_node = {"endpoint_id": "NYC", "name": "New York", "lat": 40.7, "lng": -74.0}
        curr = NODES + [new_node]
        delta = compute_delta(NODES, curr)
        assert delta["changed"] is True
        assert len(delta["nodes"]["added"]) == 1
        assert delta["nodes"]["added"][0]["endpoint_id"] == "NYC"
        assert delta["nodes"]["removed"] == []
        assert "added" in delta["summary"]

    def test_node_removed(self):
        curr = NODES[:-1]
        delta = compute_delta(NODES, curr)
        assert delta["changed"] is True
        assert len(delta["nodes"]["removed"]) == 1
        assert delta["nodes"]["removed"][0]["endpoint_id"] == "CHI"
        assert "removed" in delta["summary"]

    def test_node_modified(self):
        curr = [
            {"endpoint_id": "SEA", "name": "Seattle", "lat": 47.6, "lng": -122.3},
            {"endpoint_id": "LAX", "name": "Los Angeles", "lat": 34.0, "lng": -118.2},
            {"endpoint_id": "CHI", "name": "Chicago", "lat": 99.9, "lng": -87.6},  # lat changed
        ]
        delta = compute_delta(NODES, curr)
        assert delta["changed"] is True
        assert len(delta["nodes"]["modified"]) == 1
        assert delta["nodes"]["modified"][0]["before"]["endpoint_id"] == "CHI"
        assert "modified" in delta["summary"]

    def test_edge_added(self):
        new_edge = {"src": "SEA", "dst": "CHI", "capacity": 50}
        curr = EDGES + [new_edge]
        delta = compute_delta(EDGES, curr)
        assert delta["changed"] is True
        assert len(delta["edges"]["added"]) == 1

    def test_edge_removed(self):
        delta = compute_delta(EDGES, EDGES[:1])
        assert delta["changed"] is True
        assert len(delta["edges"]["removed"]) == 1

    def test_edge_modified(self):
        curr = [
            {"src": "SEA", "dst": "LAX", "capacity": 999},  # changed
            {"src": "LAX", "dst": "CHI", "capacity": 200},
        ]
        delta = compute_delta(EDGES, curr)
        assert delta["changed"] is True
        assert len(delta["edges"]["modified"]) == 1

    def test_mixed_nodes_and_edges(self):
        prev = NODES + EDGES
        new_node = {"endpoint_id": "NYC", "name": "New York", "lat": 40.7, "lng": -74.0}
        curr = NODES + [new_node] + EDGES[:-1]
        delta = compute_delta(prev, curr)
        assert delta["changed"] is True
        assert len(delta["nodes"]["added"]) == 1
        assert len(delta["edges"]["removed"]) == 1

    def test_empty_to_nonempty(self):
        delta = compute_delta([], NODES)
        assert delta["changed"] is True
        assert len(delta["nodes"]["added"]) == len(NODES)

    def test_nonempty_to_empty(self):
        delta = compute_delta(NODES, [])
        assert delta["changed"] is True
        assert len(delta["nodes"]["removed"]) == len(NODES)

    def test_both_empty(self):
        delta = compute_delta([], [])
        assert delta["changed"] is False

    def test_summary_pluralisation(self):
        new_nodes = [
            {"endpoint_id": "A", "name": "A"},
            {"endpoint_id": "B", "name": "B"},
        ]
        delta = compute_delta([], new_nodes)
        assert "nodes added" in delta["summary"]  # plural

        delta_single = compute_delta([], [new_nodes[0]])
        assert "node added" in delta_single["summary"]  # singular
