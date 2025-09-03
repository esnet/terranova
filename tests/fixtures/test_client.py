import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    # Import happens here so that any monkeypatching will correctly
    # affect all scopes before app is initialized
    from terranova.api.api import app

    return TestClient(app)
