from terranova.settings import ELASTIC_INDICES

INITIAL_TEMPLATES = {
    "Geo: Simple - Circle": """<svg viewBox="-5.5 -5.5 11 11" height="10" width="10" x="-5" y="-5"><circle r="5" /></svg>""",  # noqa: E501
    "Geo: Simple - Square": """<rect height="10" width="10" x="-5" y="-5" />""",  # noqa: E501
    "Geo: Simple - Star": """<svg viewBox="-8 -8 16 16" height="20" width="20" x="-10" y="-10"><polygon points="0,-7.64 1.77,-2.19 7.5,-2.19 2.87,1.18 4.64,6.63 0,3.27 -4.64,6.63 -2.87,1.18 -7.5,-2.19 -1.77,-2.19 "/></svg>""",  # noqa: E501
    "Geo: Labelled - Circle": """<svg viewBox="-5.5 -5.5 11 11" height="10" width="10" x="-5" y="-5"><circle r="5" /></svg><text x='8' y="3" fill="#111111" stroke="none" style='font-size:12px; filter: drop-shadow(0px 0px 1px rgba(255,255,255,1.0));'>{{endpoint_name}}</text>""",  # noqa: E501
    "Geo: Labelled - Square": """<rect x='-4' y='-4' width='8' height='8' /><text x='8' y="3" fill="#111111" stroke="none" style='font-size:12px; filter: drop-shadow(0px 0px 1px rgba(255,255,255,1.0));'>{{endpoint_name}}</text>""",  # noqa: E501
    "Geo: Labelled - Star": """<svg viewBox="-8 -8 16 16" height="20" width="20" x="-10" y="-10"><polygon points="0,-7.64 1.77,-2.19 7.5,-2.19 2.87,1.18 4.64,6.63 0,3.27 -4.64,6.63 -2.87,1.18 -7.5,-2.19 -1.77,-2.19 "/></svg><text x='10' y="3" fill="#111111" stroke="none" style='font-size:12px; filter: drop-shadow(0px 0px 1px rgba(255,255,255,1.0));'>{{ endpoint_name }}</text>""",  # noqa: E501
}

CREATE_STATEMENTS = {
    ELASTIC_INDICES["template"]["write"]: {
        "name": ELASTIC_INDICES["template"]["read"],
        "index_patterns": ["%s*" % ELASTIC_INDICES["template"]["write"]],
        "template": {
            "mappings": {
                "properties": {
                    "lastUpdatedBy": {"type": "keyword"},
                    "name": {"type": "keyword"},
                    "lastUpdatedOn": {"type": "date"},
                    "templateId": {
                        "eager_global_ordinals": False,
                        "norms": False,
                        "index": True,
                        "store": False,
                        "type": "keyword",
                        "split_queries_on_whitespace": False,
                        "index_options": "docs",
                        "doc_values": True,
                    },
                    "version": {"type": "integer"},
                }
            }
        },
        "composed_of": [],
        "priority": 500,
        "meta": {"description": "Terranova Templates"},
    },
    ELASTIC_INDICES["map"]["write"]: {
        "name": ELASTIC_INDICES["map"]["read"],
        "index_patterns": ["%s*" % ELASTIC_INDICES["map"]["write"]],
        "template": {
            "mappings": {
                "properties": {
                    "lastUpdatedBy": {"type": "keyword"},
                    "public": {"type": "boolean"},
                    "name": {"type": "keyword"},
                    "lastUpdatedOn": {"type": "date"},
                    "mapId": {
                        "eager_global_ordinals": False,
                        "norms": False,
                        "index": True,
                        "store": False,
                        "type": "keyword",
                        "split_queries_on_whitespace": False,
                        "index_options": "docs",
                        "doc_values": True,
                    },
                    "overrides": {"type": "object", "enabled": False},
                    "version": {"type": "integer"},
                }
            }
        },
        "composed_of": [],
        "priority": 500,
        "meta": {"description": "Terranova Maps"},
    },
    ELASTIC_INDICES["dataset"]["write"]: {
        "name": ELASTIC_INDICES["dataset"]["read"],
        "index_patterns": ["%s*" % ELASTIC_INDICES["dataset"]["write"]],
        "template": {
            "mappings": {
                "properties": {
                    "lastUpdatedBy": {"type": "keyword"},
                    "name": {"type": "keyword"},
                    "datasetId": {
                        "eager_global_ordinals": False,
                        "norms": False,
                        "index": True,
                        "store": False,
                        "type": "keyword",
                        "split_queries_on_whitespace": False,
                        "index_options": "docs",
                        "doc_values": True,
                    },
                    "lastUpdatedOn": {"type": "date"},
                    "results": {"type": "object", "enabled": False},
                    "version": {"type": "integer"},
                }
            }
        },
        "composed_of": [],
        "priority": 500,
        "meta": {"description": "Terranova Datasets"},
    },
    ELASTIC_INDICES["userdata"]["write"]: {
        "name": ELASTIC_INDICES["userdata"]["read"],
        "index_patterns": ["%s*" % ELASTIC_INDICES["userdata"]["write"]],
        "template": {
            "mappings": {
                "properties": {
                    "username": {
                        "eager_global_ordinals": False,
                        "norms": False,
                        "index": True,
                        "store": False,
                        "type": "keyword",
                        "split_queries_on_whitespace": False,
                        "index_options": "docs",
                        "doc_values": True,
                    }
                }
            }
        },
        "composed_of": [],
        "priority": 500,
        "meta": {"description": "Terranova User Data"},
    },
}
