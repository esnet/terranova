from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi_versioning import version

from terranova.backends.auth import User, auth_check
from terranova.backends.storage import backend as storage_backend
from terranova.models import (
    CheckpointSchedule,
    CheckpointScheduleRevision,
    NotificationConfig,
    NotificationConfigRevision,
    TerranovaNotFoundException,
)
from terranova.settings import TOKEN_SCOPES

router = APIRouter(tags=["Terranova Checkpoints"])


# --- Checkpoint Schedules ---

@router.get("/checkpoint-schedules/", summary="List all checkpoint schedules")
@version(1)
def list_checkpoint_schedules(
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["read"]]),
) -> list:
    return storage_backend.get_checkpoint_schedules()


@router.get(
    "/checkpoint-schedule/id/{scheduleId}/",
    summary="Get a checkpoint schedule by ID",
)
@version(1)
def get_checkpoint_schedule(
    scheduleId: str,
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["read"]]),
) -> dict:
    results = storage_backend.get_checkpoint_schedules(schedule_id=scheduleId)
    if not results:
        raise HTTPException(status_code=404, detail=f"Checkpoint schedule {scheduleId} not found")
    return results[0]


@router.post("/checkpoint-schedule/", summary="Create a checkpoint schedule")
@version(1)
def create_checkpoint_schedule(
    revision: CheckpointScheduleRevision,
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["write"]]),
) -> dict:
    # Verify the dataset exists
    datasets = storage_backend.get_datasets(dataset_id=revision.datasetId)
    if not datasets:
        raise HTTPException(
            status_code=404, detail=f"Dataset {revision.datasetId} not found"
        )
    doc = storage_backend.create_checkpoint_schedule(revision, user)
    # Register the job with the scheduler
    from terranova.checkpoint.scheduler import add_schedule
    add_schedule(doc)
    return doc


@router.put(
    "/checkpoint-schedule/id/{scheduleId}/",
    summary="Update a checkpoint schedule",
)
@version(1)
def update_checkpoint_schedule(
    scheduleId: str,
    revision: CheckpointScheduleRevision,
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["write"]]),
) -> dict:
    try:
        doc = storage_backend.update_checkpoint_schedule(scheduleId, revision, user)
        from terranova.checkpoint.scheduler import add_schedule, remove_schedule
        remove_schedule(scheduleId)
        if doc.get("enabled"):
            add_schedule(doc)
        return doc
    except TerranovaNotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete(
    "/checkpoint-schedule/id/{scheduleId}/",
    summary="Delete a checkpoint schedule",
)
@version(1)
def delete_checkpoint_schedule(
    scheduleId: str,
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["write"]]),
) -> dict:
    try:
        result = storage_backend.delete_checkpoint_schedule(scheduleId)
        from terranova.checkpoint.scheduler import remove_schedule
        remove_schedule(scheduleId)
        return result
    except TerranovaNotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post(
    "/checkpoint-schedule/id/{scheduleId}/run/",
    summary="Manually trigger a checkpoint run",
)
@version(1)
async def run_checkpoint_now(
    scheduleId: str,
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["write"]]),
) -> dict:
    from terranova.checkpoint.scheduler import run_checkpoint
    try:
        result = await run_checkpoint(scheduleId)
        return result
    except TerranovaNotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Notification Configs ---

@router.get("/notification-configs/", summary="List notification configs")
@version(1)
def list_notification_configs(
    scheduleId: str | None = None,
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["read"]]),
) -> list:
    return storage_backend.get_notification_configs(schedule_id=scheduleId)


@router.get(
    "/notification-config/id/{configId}/",
    summary="Get a notification config by ID",
)
@version(1)
def get_notification_config(
    configId: str,
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["read"]]),
) -> dict:
    results = storage_backend.get_notification_configs(config_id=configId)
    if not results:
        raise HTTPException(status_code=404, detail=f"Notification config {configId} not found")
    return results[0]


@router.post("/notification-config/", summary="Create a notification config")
@version(1)
def create_notification_config(
    revision: NotificationConfigRevision,
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["write"]]),
) -> dict:
    schedules = storage_backend.get_checkpoint_schedules(schedule_id=revision.scheduleId)
    if not schedules:
        raise HTTPException(
            status_code=404, detail=f"Checkpoint schedule {revision.scheduleId} not found"
        )
    return storage_backend.create_notification_config(revision, user)


@router.put(
    "/notification-config/id/{configId}/",
    summary="Update a notification config",
)
@version(1)
def update_notification_config(
    configId: str,
    revision: NotificationConfigRevision,
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["write"]]),
) -> dict:
    try:
        return storage_backend.update_notification_config(configId, revision, user)
    except TerranovaNotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete(
    "/notification-config/id/{configId}/",
    summary="Delete a notification config",
)
@version(1)
def delete_notification_config(
    configId: str,
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["write"]]),
) -> dict:
    try:
        return storage_backend.delete_notification_config(configId)
    except TerranovaNotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
