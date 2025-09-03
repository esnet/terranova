import pytest
from terranova.datasources.esdb import backend


@pytest.fixture(scope="session")
def esdb():
    return backend
