from terranova.backends import elasticsearch
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

datastore = defaultdict(lambda: defaultdict(dict))


def mock_elastic_backend():
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

    elasticsearch.backend.create = mock_create
    elasticsearch.backend.query = mock_query
    elasticsearch.backend.ismocked = True
    # load up fixture data
    for index in FIXTURES:
        for id_key in FIXTURES[index]:
            datastore[index][id_key] = FIXTURES[index][id_key]


mock_elastic_backend()
