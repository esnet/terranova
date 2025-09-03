# from terranova.logging import logger
# import pytest
import json
from terranova.api.api import app
from terranova.api.routers import maps, output
import pytest

# this represents the now-much-collapsed grid from the spreadsheet
# we expect all unlisted API responses to be "401 unauthorized"
public_routes = {
    # boilerplate routes
    "/openapi.json": {"HEAD": {"status_code": 200}, "GET": {"status_code": 200}},
    "/docs": {"HEAD": {"status_code": 200}, "GET": {"status_code": 200}},
    "/redoc": {"HEAD": {"status_code": 200}, "GET": {"status_code": 200}},
    "/docs/oauth2-redirect": {"HEAD": {"status_code": 200}, "GET": {"status_code": 200}},
    # actual api
    "/": {"GET": {"status_code": 200}},
    "/login/": {"GET": {"status_code": 200}, "POST": {"status_code": 422}},
    "/public/maps/": {"GET": {"status_code": 200}},
    "/public/output/map/{mapId}/": {"GET": {"status_code": 200}},
    "/public/output/map/{mapId}/{output_type}/": {
        "GET": {"status_code": 200, "output_type": "svg"}
    },
    # datasource metadata routes
    "/datasources/": {"HEAD": {"status_code": 200}, "GET": {"status_code": 200}},
    "/circuits/filterable_columns/": {"HEAD": {"status_code": 200}, "GET": {"status_code": 200}},
    "/sheets/{sheet_id}/filterable_columns/": {
        "HEAD": {"status_code": 200},
        "GET": {"status_code": 200},
    },
    "/services/filterable_columns/": {"HEAD": {"status_code": 200}, "GET": {"status_code": 200}},
}


def enumerate_paths(app):
    flattened_methods = []
    for route in app.routes:
        for method in route.methods:
            flattened_methods.append(
                [
                    method,
                    route.path,
                ]
            )
    return flattened_methods


class Formatter(dict):
    def __missing__(self, key):
        return "{%s}" % key


# clean this up to flatten this out into a list of all verbs and routes
@pytest.mark.parametrize("method, path", enumerate_paths(app))
@pytest.mark.anonymous
def test_no_auth(client, mock_elastic_backend, method, path):
    maps.elastic_backend = mock_elastic_backend
    output.elastic_backend = mock_elastic_backend
    route_defaults = public_routes.get(path, {}).get(method, {})
    # all routes expect a 401 response code by default unless otherwise configured
    expected_status_code = route_defaults.get("status_code", 401)
    formatted_path = path.format_map(Formatter(**route_defaults))
    response = getattr(client, method.lower())(formatted_path)
    try:
        assert expected_status_code == response.status_code
    except AssertionError:
        raise Exception(
            "path: %s\nexpected status code: %s\nObserved status code: %s\n\nResponse body: %s"
            % (formatted_path, expected_status_code, response.status_code, response.text)
        )


def test_expired_auth(client, expired_jwt):
    response = client.get(
        "/types/circuit_type_name", headers={"Authorization": "Bearer %s" % expired_jwt}
    )
    assert response.status_code == 401


def test_incorrect_permissions(client, readonly_jwt, dataset_revision):
    response = client.post(
        "/dataset/",
        data=json.dumps(dataset_revision.dict()),
        headers={"Authorization": "Bearer %s" % readonly_jwt},
    )
    assert response.status_code == 401


def test_correct_permissions(client, readwrite_jwt, dataset_revision, noop_elastic):
    response = client.post(
        "/dataset/",
        data=json.dumps(dataset_revision.dict()),
        headers={"Authorization": "Bearer %s" % readwrite_jwt},
    )
    assert response.status_code == 200


def test_bad_crypto_auth(client, bad_signature_jwt):
    response = client.get(
        "/types/circuit_type_name", headers={"Authorization": "Bearer %s" % bad_signature_jwt}
    )
    assert response.status_code == 401
