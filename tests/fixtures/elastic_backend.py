import pytest
import os
import json
import terranova.backends.elasticsearch
from terranova.logging import logger
from testcontainers.elasticsearch import ElasticSearchContainer
from collections import defaultdict

PUBLIC_MAP = {
    "mapId": "{mapId}",
    "public": True,
    "name": "test",
    "version": 1,
    "overrides": [],
    "configuration": {
        "initialViewStrategy": "test",
        "viewport": {},
        "background": "#FFF",
        "tileset": "",
        "editMode": False,
        "showSidebar": False,
        "showViewControls": False,
        "showLegend": False,
        "enableScrolling": False,
        "enableEditing": False,
        "enableNodeAnimation": False,
        "enableEdgeAnimation": False,
        "zIndexBase": 1000,
        "layers": [],
    },
    "lastUpdatedBy": "test",
    "lastUpdatedOn": "2000-01-01T00:00:00Z",
}
PRIVATE_MAP = {"mapId": "private", "public": False}

FIXTURES = {
    "terranova-map": {
        PRIVATE_MAP["mapId"]: PRIVATE_MAP,
        PUBLIC_MAP["mapId"]: PUBLIC_MAP,
    }
}


@pytest.fixture()
def noop_elastic(monkeypatch):
    import terranova.backends.elasticsearch

    monkeypatch.setattr(
        terranova.backends.elasticsearch.ElasticSearchBackend,
        "create",
        lambda self, index, id, doc: {"status": "created"},
    )


@pytest.fixture(scope="session")
def elastic_backend():
    container = ElasticSearchContainer("elasticsearch:8.6.0")
    container.start()
    url = container.get_url()

    backend = terranova.backends.elasticsearch.ElasticSearchBackend(url)

    _load_example_maps(backend)

    yield backend

    container.stop()


def _load_example_maps(backend):
    """
    This loads up all of the JSON files in the 'example_maps' subdirectory
    and indexes them into ElasticSearch. It gives us a known starting state.
    """

    assert backend.connection_info(), "Able to talk to local ES"

    path = os.path.dirname(__file__) + "../test_maps/"
    filenames = [f for f in os.listdir(path) if f.endswith(".json")]
    for filename in filenames:
        with open(path + "/" + filename) as f:
            map_json = json.load(f)
        map_name = map_json["name"]
        logger.info(f"Loading test map {map_name}")
        logger.debug(f"{map_json=}")
        res = backend.create(map_name, map_json)
        assert res, f"Creating fixture '{filename}'"


def _load_example_layers(backend):
    assert backend.connection_info(), "Able to talk to local ES"
    print(backend)
    import pdb

    pdb.set_trace()


datastore = defaultdict(lambda: defaultdict(dict))


@pytest.fixture(scope="session")
def mock_elastic_backend():
    nonsense_url = "http://example.com:80"
    backend = terranova.backends.elasticsearch.ElasticSearchBackend(nonsense_url)

    def mock_create(index, id, doc):
        datastore[index][id] = doc
        return doc

    def mock_query(index, query, collapse=None, sort=None, fields=None):
        # Transform e.g. "terranova-layer-*" to "terranova-layer" to match. pretty crappy
        index = index.replace("-*", "")
        idx = datastore[index]
        terms = {}
        for term in query["bool"]["filter"]:
            for term_key, term_value in term.items():
                for term, value in term_value.items():
                    terms[term] = value

        def matches(item, terms):
            for term_key, term_value in terms.items():
                print(item, term_key, term_value)
                if item[term_key] != term_value:
                    return False
            return True

        return [idx[k] for k in idx if matches(idx[k], terms)]

    backend.create = mock_create
    backend.query = mock_query
    backend.ismocked = True
    # load up fixture data
    for index in FIXTURES:
        for id_key in FIXTURES[index]:
            datastore[index][id_key] = FIXTURES[index][id_key]
    return backend
