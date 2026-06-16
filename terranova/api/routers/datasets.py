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
    SnapshotFieldEnum,
    TerranovaNotFoundException,
    SnapshotAcknowledgeRequest,
    SnapshotAcceptRequest,
)
from terranova.checkpoint.differ import compute_delta, hash_results

router = APIRouter(tags=["Terranova Datasets"])

default_fields = [
    DatasetFieldEnum.datasetId,
    DatasetFieldEnum.name,
    DatasetFieldEnum.currentSnapshotId,
    DatasetFieldEnum.latestCheckpointId,
    DatasetFieldEnum.acknowledgedCheckpointId,
]


def parse_dataset_endpoint(endpoint_string):
    """
    Helper function that parses a dataset endpoint like
    'google_sheets' or 'google_sheets?sheet_id=abcdef' and returns
    ('google_sheets', {}) and ('google_sheets', {"sheet_id": "abcdef"})
    respectively.
    """
    endpoint = endpoint_string.split("?")[0]
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
    fields: List[DatasetFieldEnum] = Query(default_fields),
    filters: DatasetFilters = Depends(),
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["read"]]),
) -> List[dict[str, Any]]:
    return storage_backend.get_datasets(
        fields=[f.name for f in fields], filters=filters
    )


@router.get("/dataset/id/{datasetId}/", summary="Gets a single dataset by its ID")
@version(1)
def dataset_by_id(
    datasetId: str,
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["read"]]),
) -> Dataset:
    result = storage_backend.get_datasets(dataset_id=datasetId)
    if not result:
        raise HTTPException(status_code=404, detail="Dataset with id %s not found" % datasetId)
    return result[0]


@router.get(
    "/dataset/id/{datasetId}/snapshots/",
    summary="Lists snapshots for a dataset",
)
@version(1)
def dataset_snapshots(
    datasetId: str,
    type: str | None = Query(None, description="Filter by snapshot type: user_save or checkpoint"),
    limit: int = Query(50),
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["read"]]),
) -> List[dict[str, Any]]:
    # Verify dataset exists
    datasets_list = storage_backend.get_datasets(dataset_id=datasetId)
    if not datasets_list:
        raise HTTPException(status_code=404, detail="Dataset with id %s not found" % datasetId)
    return storage_backend.get_snapshots(datasetId, snapshot_type=type, limit=limit)


@router.get(
    "/snapshot/id/{snapshotId}/",
    summary="Gets a single snapshot by its ID",
)
@version(1)
def snapshot_by_id(
    snapshotId: str,
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["read"]]),
) -> dict:
    snap = storage_backend.get_snapshot(snapshotId)
    if not snap:
        raise HTTPException(status_code=404, detail="Snapshot %s not found" % snapshotId)
    return snap


@router.get(
    "/dataset/id/{datasetId}/diff/{snapshotId1}/{snapshotId2}/",
    summary="Returns the diff between two snapshots of a dataset",
)
@version(1)
def dataset_diff(
    datasetId: str,
    snapshotId1: str,
    snapshotId2: str,
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["read"]]),
) -> dict:
    def _fetch_snap(sid: str):
        snap = storage_backend.get_snapshot(sid)
        if not snap:
            raise HTTPException(status_code=404, detail="Snapshot %s not found" % sid)
        return snap

    snap1 = _fetch_snap(snapshotId1)
    snap2 = _fetch_snap(snapshotId2)
    r1 = snap1.get("results") or []
    r2 = snap2.get("results") or []
    delta = compute_delta(r1, r2)
    return {
        "datasetId": datasetId,
        "fromSnapshotId": snapshotId1,
        "toSnapshotId": snapshotId2,
        "fromHash": hash_results(r1),
        "toHash": hash_results(r2),
        "delta": delta,
    }


@router.post(
    "/dataset/id/{datasetId}/acknowledge/",
    summary="Mark a checkpoint snapshot as reviewed (advances the diff pointer)",
)
@version(1)
def acknowledge_checkpoint(
    datasetId: str,
    body: SnapshotAcknowledgeRequest,
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["write"]]),
):
    try:
        result = storage_backend.update_dataset_pointers(
            datasetId, acknowledged_checkpoint_id=body.snapshotId
        )
        return result["object"]
    except TerranovaNotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post(
    "/dataset/id/{datasetId}/accept/",
    summary="Accept checkpoint changes: re-runs the query, saves a new user_save snapshot, advances the diff pointer",
)
@version(1)
def accept_checkpoint(
    datasetId: str,
    body: SnapshotAcceptRequest,
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["write"]]),
):
    try:
        datasets_list = storage_backend.get_datasets(dataset_id=datasetId)
        if not datasets_list:
            raise TerranovaNotFoundException(f"Dataset {datasetId} not found")
        dataset = datasets_list[0]

        # Re-run the live query
        endpoint, context = parse_dataset_endpoint(dataset["query"]["endpoint"])
        from terranova.models import DatasetQuery
        query = DatasetQuery(**dataset["query"])
        query_results = datasources[endpoint].backend.query(
            query.filters, limit=None, apply_templated_filters=False, **context
        )

        # Create new user_save snapshot
        next_version = storage_backend.next_user_save_version(datasetId)
        snap = storage_backend.create_snapshot(
            datasetId, query_results.data, "user_save", user, version=next_version
        )

        # Update dataset pointers
        updated = storage_backend.update_dataset_pointers(
            datasetId,
            current_snapshot_id=snap["snapshotId"],
            acknowledged_checkpoint_id=body.snapshotId,
        )
        return {"snapshot": snap, "dataset": updated["object"]}
    except TerranovaNotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put(
    "/dataset/id/{datasetId}/",
    summary="Update a dataset's query and save a new user_save snapshot",
)
@version(1)
def update_dataset(
    datasetId: str,
    datasetRevision: DatasetRevision,
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["write"]]),
):
    try:
        # Update query/name in place
        storage_backend.update_dataset_query(datasetId, datasetRevision, user)

        # Run live query and create a user_save snapshot
        endpoint, context = parse_dataset_endpoint(datasetRevision.query.endpoint)
        query_results = datasources[endpoint].backend.query(
            datasetRevision.query.filters, limit=None, apply_templated_filters=False, **context
        )
        next_version = storage_backend.next_user_save_version(datasetId)
        snap = storage_backend.create_snapshot(
            datasetId, query_results.data, "user_save", user, version=next_version
        )

        # Update currentSnapshotId pointer
        result = storage_backend.update_dataset_pointers(
            datasetId, current_snapshot_id=snap["snapshotId"]
        )
        return {"result": "updated", "snapshot": snap, "object": result["object"]}
    except TerranovaNotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/dataset/", summary="Creates a new dataset")
@version(1)
def create_dataset(
    datasetRevision: DatasetRevision,
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["write"]]),
):
    return storage_backend.create_dataset(datasetRevision, user)
