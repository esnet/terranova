from fastapi import APIRouter, Depends, HTTPException, Query, Security
from terranova.settings import TOKEN_SCOPES
from fastapi_versioning import version
from typing import List, Any
from urllib.parse import parse_qs

from terranova.backends.auth import User, auth_check
from terranova.backends.storage import backend as storage_backend
from terranova.backends.datasources import datasources
from terranova.models import (
    Dataset,
    DatasetRevision,
    DatasetFilters,
    DatasetFieldEnum,
    TerranovaNotFoundException,
    TerranovaVersion,
)

router = APIRouter(tags=["Terranova Datasets"])

default_fields = [
    DatasetFieldEnum.datasetId,
    DatasetFieldEnum.name,
    DatasetFieldEnum.version,
    DatasetFieldEnum.lastUpdatedBy,
    DatasetFieldEnum.lastUpdatedOn,
]


def parse_dataset_endpoint(endpoint_string):
    """
    Helper function that parses a dataset endpoint like
    'esdb' or 'google_sheets?sheet_id=abcdef' and returns
    ('esdb', {}) and ('google_sheets', {"sheet_id": "abcdef"})
    respectively.
    """
    endpoint = endpoint_string.split("?")[0]
    # if there's context data, set it
    context = {}
    if len(endpoint_string.split("?", 1)) > 1:
        context_data = endpoint_string.split("?", 1)[1]
        intermediate_context = parse_qs(context_data)
        for k, v in intermediate_context.items():
            if len(v) == 1:
                context[k] = v[0]
            else:
                context[k] = v
    return endpoint, context


@router.get("/datasets/", summary="Gets all datasets, optionally filtered")
@version(1)
def datasets(
    version: TerranovaVersion = Depends(),
    fields: List[DatasetFieldEnum] = Query(default_fields),
    filters: DatasetFilters = Depends(),
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["read"]]),
) -> List[dict[str, Any]]:

    result = storage_backend.get_datasets(
        fields=[f.name for f in fields], filters=filters, version=version
    )

    return result


@router.get("/dataset/id/{datasetId}/", summary="Gets a single dataset by its ID")
@version(1)
def dataset_by_id(
    datasetId: str, user: User = Security(auth_check, scopes=[TOKEN_SCOPES["read"]])
) -> Dataset:
    result = storage_backend.get_datasets(dataset_id=datasetId)
    if len(result) < 1:
        raise HTTPException(status_code=404, detail="Dataset with id %s not found" % datasetId)
    return result[0]


@router.put(
    "/dataset/id/{datasetId}/",
    summary="Creates a new version of an existing dataset based on the dataset ID",
)
@version(1)
def update_dataset(
    datasetId: str,
    datasetRevision: DatasetRevision,
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["write"]]),
):
    try:
        endpoint, context = parse_dataset_endpoint(datasetRevision.query.endpoint)
        query_results = datasources[endpoint].backend.query(
            datasetRevision.query.filters, limit=None, apply_templated_filters=False, **context
        )
        return storage_backend.update_dataset(datasetId, datasetRevision, query_results.data, user)
    except TerranovaNotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/dataset/", summary="Creates a new dataset")
@version(1)
def create_dataset(
    datasetRevision: DatasetRevision,
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["write"]]),
):
    return storage_backend.create_dataset(datasetRevision, user)
