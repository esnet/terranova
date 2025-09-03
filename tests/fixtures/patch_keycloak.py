from terranova.settings import TEST_JWT_KEY
import pytest


# These fixtures are not used directly. They exist only to patch out the function calls
# to Keycloak so that unit tests do not depend on an instance of it at runtime
@pytest.fixture(autouse=True)
def patch_keycloak(monkeypatch, readonly_jwt, readwrite_jwt, no_roles_jwt):
    import terranova

    # Instead of talking to keycloak for its pub key, use the test jwt key which
    # we're using to "sign" all of the testing JWTs
    def get_pub_key():
        return TEST_JWT_KEY

    monkeypatch.setattr(terranova.backends.auth.keycloak, "_get_pub_key", get_pub_key)
