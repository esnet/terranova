from fastapi import Depends, HTTPException
from fastapi.security import OAuth2AuthorizationCodeBearer, SecurityScopes
from authlib.jose import jwt
from authlib.jose.errors import ExpiredTokenError, BadSignatureError
from functools import cache
import json
import requests
from terranova.settings import (
    KEYCLOAK_SERVER,
    KEYCLOAK_REALM,
    KEYCLOAK_CLIENT,
    KEYCLOAK_SECRET,
    KEYCLOAK_PUBLIC_KEY,
    TOKEN_SCOPES,
)

from pydantic import BaseModel


class User(BaseModel):
    name: str
    email: str
    username: str


KEYCLOAK_BASE_URL = f"https://{KEYCLOAK_SERVER}/auth/realms/{KEYCLOAK_REALM}"
TOKEN_URL = KEYCLOAK_BASE_URL + "/protocol/openid-connect/token"
AUTHZ_URL = KEYCLOAK_BASE_URL + "/protocol/openid-connect/auth"

oauth2_scheme = OAuth2AuthorizationCodeBearer(
    tokenUrl=TOKEN_URL,
    authorizationUrl=AUTHZ_URL,
    refreshUrl=TOKEN_URL,
    scopes={
        TOKEN_SCOPES["read"]: "Can read map information in Terranova",
        TOKEN_SCOPES["write"]: "Can write map information in Terranova",
        TOKEN_SCOPES["publish"]: "Can publish map information in Terranova",
    },
)
#     scheme_name="TerranovaReadonly"
# )

# optional_oauth2_scheme = OAuth2AuthorizationCodeBearer(
#     tokenUrl=TOKEN_URL, authorizationUrl=AUTHZ_URL, refreshUrl=TOKEN_URL, auto_error=False,
#     scopes={"terranova:maps:read": "Can read map information in Terranova"},
#     scheme_name="TerranovaOptionalReadonly"
# )

# readwrite_oauth2_scheme = OAuth2AuthorizationCodeBearer(
#     tokenUrl=TOKEN_URL, authorizationUrl=AUTHZ_URL, refreshUrl=TOKEN_URL, auto_error=False,
#     scopes={"terranova:maps:read": "Can read map information in Terranova",
#             "terranova:maps:write": "Can write map information in Terranova"},
#     scheme_name="TerranovaReadwrite"
# )


# This function can be a Depends for API calls wanting to generate Keycloak
# tokens from a given user/pass
def keycloak_login(username, password):
    response = requests.post(
        TOKEN_URL,
        data={
            "client_id": KEYCLOAK_CLIENT,
            "client_secret": KEYCLOAK_SECRET,
            "username": username,
            "password": password,
            "grant_type": "password",
        },
        verify=False,
    )  # TODO: remove this once cert is real

    return json.loads(response.content)


def read_write_auth(
    needed_scopes: SecurityScopes = [TOKEN_SCOPES["write"]],
    bearer_token: str = Depends(oauth2_scheme),
) -> User:
    return get_user(bearer_token, needed_scopes)


# This is the function that API calls should use as a Depends to ensure
# that they get back the current User from the Authorization header
def auth_check(needed_scopes: SecurityScopes, bearer_token: str = Depends(oauth2_scheme)) -> User:
    return get_user(bearer_token, needed_scopes)


def optional_auth_check(
    needed_scopes: SecurityScopes = [TOKEN_SCOPES["read"]],
    bearer_token: str = Depends(oauth2_scheme),
) -> User | None:
    if bearer_token:
        return get_user(bearer_token, needed_scopes)
    return None


# Makes a request to the defined Keycloak server to get its
# public signing key, used to verify a JWT
@cache
def _get_pub_key():
    # TODO: remove the verify=False here once keycloak has a valid SSL certificate
    try:
        realm_info = json.loads(requests.get(KEYCLOAK_BASE_URL, verify=False).content)
    except Exception:
        realm_info = {"public_key": KEYCLOAK_PUBLIC_KEY}  # in case we lose connection to keycloak
    public_key = (
        "-----BEGIN PUBLIC KEY-----\n%s\n-----END PUBLIC KEY-----" % realm_info["public_key"]
    )
    return public_key


def get_user(bearer_token: str, needed_scopes: SecurityScopes) -> User:
    public_key = _get_pub_key()

    try:
        claims = jwt.decode(bearer_token, public_key)
    except BadSignatureError:
        raise HTTPException(status_code=401, detail="Token has bad signature")

    try:
        claims.validate()
    except ExpiredTokenError:
        raise HTTPException(status_code=401, detail="Token is expired")

    token_scopes = claims.get("scope", [])

    for scope in needed_scopes.scopes:
        if scope not in token_scopes:
            raise HTTPException(status_code=401, detail="Insufficient permissions for this action")

    return User(name=claims["name"], username=claims["preferred_username"], email=claims["email"])
