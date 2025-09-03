# from terranova.logging import logger
# import pytest


def test_root(client):
    response = client.get("/")
    assert response.status_code == 200

    endpoint_data = response.json()
    assert len(endpoint_data) > 0
