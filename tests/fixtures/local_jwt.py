from terranova.settings import TEST_JWT_KEY, TOKEN_SCOPES
from jose import jwt
import time
import pytest

EXPIRATION = 300


@pytest.fixture
def readonly_jwt():
    return _make_jwt(scopes=[TOKEN_SCOPES["read"]])


@pytest.fixture
def readwrite_jwt():
    return _make_jwt(scopes=[TOKEN_SCOPES["write"]])


@pytest.fixture
def expired_jwt():
    return _make_jwt(ts=time.time() - EXPIRATION - 1)


@pytest.fixture
def no_roles_jwt():
    return _make_jwt(scopes=[])


@pytest.fixture
def bad_signature_jwt():
    return _make_jwt(key="bad")


def _make_jwt(roles=[], scopes=[TOKEN_SCOPES["read"]], ts=None, key=TEST_JWT_KEY):
    if ts is None:
        ts = int(time.time())

    test_token = {
        "exp": ts + EXPIRATION,
        "iat": ts,
        "typ": "Bearer",
        "preferred_username": "tester",
        "name": "Tester McUnit",
        "email": "maptester@es.net",
        "realm_access": {"roles": []},
        "scope": " ".join(scopes),
    }

    test_jwt = jwt.encode(test_token, key)
    return test_jwt
