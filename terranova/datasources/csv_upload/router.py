import uuid
from fastapi import APIRouter, Depends, Security, Request, UploadFile, File, Form
from terranova.settings import TOKEN_SCOPES
from terranova.abstract_models import InputModifier, QueryFilter
from fastapi.responses import JSONResponse
from terranova.backends.auth import auth_check
from fastapi_versioning import version
from typing import List
from .backend import CSVBackend
from .models import Edge, CSVDataset, TypeFilters
from terranova.backends.auth import User
from .parser import parse_csv_upload
from collections import defaultdict

router = APIRouter(tags=["CSV Upload"])
backend = CSVBackend()


def _decode_field(field_name):
    operator = None
    for modifier in InputModifier:
        if not field_name.endswith("_" + modifier.name):
            continue
        field_name = field_name.replace("_" + modifier.name, "")
        operator = modifier
    return (field_name, operator)


@router.post("/csv/")
@version(1)
async def upload_csv(
    name: str = Form(...),
    nodes_file: UploadFile = File(...),
    edges_file: UploadFile = File(...),
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["write"]]),
):
    nodes_content = (await nodes_file.read()).decode("utf-8")
    edges_content = (await edges_file.read()).decode("utf-8")

    csv_id = uuid.uuid4().hex
    edges, columns, types = parse_csv_upload(nodes_content, edges_content, csv_id)
    backend.insert_dataset(csv_id, name, edges, columns, types)

    return JSONResponse({"csv_id": csv_id, "name": name, "edge_count": len(edges)})


@router.get("/csv/")
@version(1)
def list_csvs(
    limit: int = 10,
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["read"]]),
) -> List[CSVDataset]:
    response = backend.list_csvs(limit=limit)
    headers = {
        "X-Result-Count": "%s" % response.count,
        "Access-Control-Expose-Headers": "X-Result-Count",
    }
    return JSONResponse(content=response.data, headers=headers)


@router.get("/csv/{csv_id}/edges/")
@version(1)
def edges(
    request: Request,
    csv_id: str,
    filters: TypeFilters = Depends(),
    limit: int = 10,
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["read"]]),
) -> List[Edge]:
    filts = []
    query_params = defaultdict(list)
    for field_tuple in request.query_params.multi_items():
        name, value = field_tuple
        query_params[name].append(value)
    for fld, value in query_params.items():
        field_name, operator = _decode_field(fld)
        filts.append(QueryFilter(field=field_name, operator=operator, value=value))
    response = backend.query(filts, csv_id=csv_id, limit=limit)
    headers = {
        "X-Result-Count": "%s" % response.count,
        "Access-Control-Expose-Headers": "X-Result-Count",
    }
    return JSONResponse(content=response.data, headers=headers)


@router.get("/csv/{csv_id}/distinct/{column}/")
@version(1)
def distinct_values(
    csv_id: str,
    column: str,
    filters: TypeFilters = Depends(),
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["read"]]),
) -> List[str]:
    return backend.get_unique_values(
        column, list(filters), extra_criteria=[{"csv_id": csv_id}]
    )


@router.get("/csv/{csv_id}/filterable_columns/")
@version(1)
def list_filterable_columns(csv_id: str):
    cols = backend.list_columns(csv_id)

    def cleanup_column_name(column_name):
        column_name = " ".join(column_name.split("_"))
        return column_name.title()

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


@router.delete("/csv/{csv_id}/")
@version(1)
def delete_csv(
    csv_id: str,
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["write"]]),
):
    backend.delete_dataset(csv_id)
    return JSONResponse({"deleted": True, "csv_id": csv_id})
