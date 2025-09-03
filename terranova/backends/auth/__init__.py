# flake8: noqa
from terranova.settings import AUTH_BACKEND

if AUTH_BACKEND == "keycloak":
    from .keycloak import User, auth_check, get_user
if AUTH_BACKEND == "basic":
    from .basic import User, auth_check, get_user
