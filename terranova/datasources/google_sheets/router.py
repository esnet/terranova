from fastapi import APIRouter, Depends, Security, Request
from terranova.settings import TOKEN_SCOPES, GOOGLE_SHEETS_CREDENTIAL_SOURCE
from terranova.abstract_models import InputModifier, QueryFilter
from fastapi.responses import JSONResponse
from terranova.backends.auth import auth_check
from fastapi_versioning import version
from typing import List
from .backend import GoogleSheetsBackend
from .models import Edge, GoogleSheet, TypeFilters
from terranova.backends.auth import User
from collections import defaultdict

router = APIRouter(tags=["Google Sheets"])
backend = GoogleSheetsBackend()


@router.get("/sheets/{sheet_id}/distinct/{column}/")
@version(1)
def distinct_values(
    sheet_id: str,
    column: str,
    filters: TypeFilters = Depends(),
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["read"]]),
) -> List[str]:
    return backend.get_unique_values(
        column, list(filters), extra_criteria=[{"sheet_id": sheet_id}]
    )


def _decode_field(field_name):
    operator = None

    for modifier in InputModifier:
        if not field_name.endswith("_" + modifier.name):
            continue
        field_name = field_name.replace("_" + modifier.name, "")
        operator = modifier

    return (field_name, operator)


@router.get("/sheets/{sheet_id}/edges/")
@version(1)
def edges(
    request: Request,
    sheet_id: str,
    filters: TypeFilters = Depends(),
    limit: int = 10,
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["read"]]),
) -> List[Edge]:
    filts = []
    # in other contexts we would do something like this
    # filts = [f for f in filters if f.value]
    # but we need something a bit more complicated here:
    query_params = defaultdict(list)
    # deal with the case where we have multiple values for each field
    for field_tuple in request.query_params.multi_items():
        name, value = field_tuple
        query_params[name].append(value)
    # then create filters from the field/value list pairs
    for fld, value in query_params.items():
        field_name, operator = _decode_field(fld)
        filts.append(
            QueryFilter(
                field=field_name,
                operator=operator,
                value=value,
            )
        )
    response = backend.query(filts, sheet_id=sheet_id, limit=limit)
    headers = {
        "X-Result-Count": "%s" % response.count,
        "Access-Control-Expose-Headers": "X-Result-Count",
    }
    return JSONResponse(content=response.data, headers=headers)


if GOOGLE_SHEETS_CREDENTIAL_SOURCE == "dynamic":

    @router.post("/sheets/credentials/")
    @version(1)
    def create_credential(
        jwt_credential: str,
        user: User = Security(auth_check, scopes=[TOKEN_SCOPES["admin"]]),
    ):
        response = backend.create_credential(jwt_credential)
        return JSONResponse(response)

    @router.get("/sheets/credentials/")
    @version(1)
    def list_dynamic_credentials(
        user: User = Security(auth_check, scopes=[TOKEN_SCOPES["admin"]])
    ):
        response = backend.list_credentials()
        headers = {
            "X-Result-Count": "%s" % response.count,
            "Access-Control-Expose-Headers": "X-Result-Count",
        }
        return JSONResponse(content=response.data, headers=headers)

    @router.delete("/sheets/credentials/{project_id}")
    @version(1)
    def delete_credential(
        project_id: str, user: User = Security(auth_check, scopes=[TOKEN_SCOPES["admin"]])
    ):
        response = backend.delete_credential(project_id)
        return JSONResponse(content={"deleted": True, "credential": response.data})


if GOOGLE_SHEETS_CREDENTIAL_SOURCE == "static":

    @router.get("/sheets/credentials/")
    @version(1)
    def list_static_credentials(user: User = Security(auth_check, scopes=[TOKEN_SCOPES["admin"]])):
        response = backend.list_static_credentials()
        headers = {
            "X-Result-Count": "%s" % response.count,
            "Access-Control-Expose-Headers": "X-Result-Count",
        }
        return JSONResponse(content=response.data, headers=headers)


@router.get("/sheets/")
@version(1)
def list_sheets(
    limit: int = 10,
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["read"]]),
) -> List[GoogleSheet]:
    response = backend.list_sheets(limit=limit)
    headers = {
        "X-Result-Count": "%s" % response.count,
        "Access-Control-Expose-Headers": "X-Result-Count",
    }
    return JSONResponse(content=response.data, headers=headers)


def cleanup_column_name(column_name):
    column_name = " ".join(column_name.split("_"))
    return column_name.title()


@router.get("/sheets/{sheet_id}/filterable_columns/")
@version(1)
def list_filterable_columns(sheet_id: str):
    cols = backend.list_columns(sheet_id)
    return JSONResponse(
        [
            {
                "label": cleanup_column_name(c),
                "field": c,
                "placeholder": "Filter %ss..." % cleanup_column_name(c),
            }
            for c in cols
        ]
    )
