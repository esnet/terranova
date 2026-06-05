"""
APScheduler-based checkpoint scheduler.

Integrated into the FastAPI process via lifespan. Each enabled CheckpointSchedule
becomes an interval job that:
  1. Runs the dataset query live
  2. Compares the result hash against the latest stored version
  3. If changed, saves a new dataset version (checkpoint=True) and applies retention
  4. Sends notifications to all configured recipients
"""
import logging
from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore

from terranova.models import TerranovaNotFoundException, DatasetRevision
from terranova.checkpoint.differ import hash_results, compute_delta
from terranova.checkpoint.retention import apply_retention
from terranova.checkpoint.notifications import notify
from terranova.settings import SQLITE_DB_PATH, STORAGE_BACKEND, CHECKPOINTS_ENABLED

logger = logging.getLogger(__name__)

_scheduler: AsyncIOScheduler | None = None


def _job_store_url() -> str:
    if STORAGE_BACKEND == "sqlite":
        return f"sqlite:///{SQLITE_DB_PATH}"
    # For ES deployments, persist APScheduler jobs in a sidecar SQLite file
    return "sqlite:////var/lib/terranova/checkpoint-jobs.db"


def init_scheduler(storage_backend):
    global _scheduler
    if not CHECKPOINTS_ENABLED:
        logger.info("Checkpoints disabled in config; scheduler not started")
        return

    jobstores = {"default": SQLAlchemyJobStore(url=_job_store_url())}
    _scheduler = AsyncIOScheduler(jobstores=jobstores)

    # Re-register all enabled schedules from storage
    for schedule_doc in storage_backend.get_checkpoint_schedules():
        if schedule_doc.get("enabled"):
            _add_job(schedule_doc)

    _scheduler.start()
    logger.info("Checkpoint scheduler started")


def shutdown_scheduler():
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        _scheduler = None


def add_schedule(schedule_doc: dict):
    if _scheduler is None or not schedule_doc.get("enabled"):
        return
    _add_job(schedule_doc)


def remove_schedule(schedule_id: str):
    if _scheduler is None:
        return
    try:
        _scheduler.remove_job(schedule_id)
    except Exception:
        pass


def _add_job(schedule_doc: dict):
    _scheduler.add_job(
        run_checkpoint,
        "interval",
        minutes=schedule_doc["intervalMinutes"],
        id=schedule_doc["scheduleId"],
        replace_existing=True,
        kwargs={"schedule_id": schedule_doc["scheduleId"]},
    )
    logger.debug(
        "Registered checkpoint job %s every %d min",
        schedule_doc["scheduleId"],
        schedule_doc["intervalMinutes"],
    )


async def run_checkpoint(schedule_id: str) -> dict:
    """
    Execute one checkpoint run for the given schedule.

    Returns a dict with keys: schedule_id, status, version (if saved), summary.
    """
    from terranova.backends.storage import backend as storage_backend
    from terranova.backends.datasources import datasources
    from terranova.api.routers.datasets import parse_dataset_endpoint

    schedules = storage_backend.get_checkpoint_schedules(schedule_id=schedule_id)
    if not schedules:
        raise TerranovaNotFoundException(f"Checkpoint schedule {schedule_id} not found")
    schedule = schedules[0]

    dataset_id = schedule["datasetId"]
    datasets = storage_backend.get_datasets(dataset_id=dataset_id)
    if not datasets:
        raise TerranovaNotFoundException(f"Dataset {dataset_id} not found")
    dataset = datasets[0]

    # Run the live query
    try:
        endpoint, context = parse_dataset_endpoint(dataset["query"]["endpoint"])
        query_result = datasources[endpoint].backend.query(
            dataset["query"]["filters"],
            limit=None,
            apply_templated_filters=False,
            **context,
        )
        current_results = query_result.data
    except Exception as e:
        err = str(e)
        storage_backend.update_checkpoint_schedule_status(
            schedule_id, datetime.now(), "error", last_error=err
        )
        logger.error("Checkpoint %s query failed: %s", schedule_id, err)
        return {"schedule_id": schedule_id, "status": "error", "error": err}

    # Compare with the latest stored results
    prev_results = dataset.get("results") or []
    current_hash = hash_results(current_results)
    prev_hash = hash_results(prev_results)

    if current_hash == prev_hash:
        storage_backend.update_checkpoint_schedule_status(
            schedule_id, datetime.now(), "ok"
        )
        logger.debug("Checkpoint %s: no change", schedule_id)
        return {"schedule_id": schedule_id, "status": "ok", "summary": "No changes detected"}

    # Data changed — compute delta and save a new version
    delta = compute_delta(prev_results, current_results)

    # Build a DatasetRevision from stored query definition
    from terranova.models import DatasetRevision, DatasetQuery
    from terranova.abstract_models import QueryFilter

    class _SystemUser:
        username = "terranova-scheduler"

    revision = DatasetRevision(
        name=dataset["name"],
        query=DatasetQuery(**dataset["query"]),
    )

    saved = storage_backend.update_dataset(
        dataset_id, revision, current_results, _SystemUser()
    )
    new_version = saved["object"]["version"]

    # Mark the new version as a checkpoint
    # update_dataset creates a new row; we need to tag it
    from terranova.models import TerranovaVersion
    new_v = TerranovaVersion(version=new_version)  # type: ignore[call-arg]
    version_docs = storage_backend.get_datasets(dataset_id=dataset_id, version=new_v)
    if version_docs:
        # Patch the checkpoint flag in-place via the raw backend
        _patch_checkpoint_flag(storage_backend, dataset_id, new_version)

    # Apply retention policy
    from terranova.models import RetentionPolicy
    retention_data = schedule.get("retention") or {}
    retention = RetentionPolicy(**retention_data)
    pruned = apply_retention(dataset_id, retention, storage_backend)

    # Send notifications
    configs = storage_backend.get_notification_configs(schedule_id=schedule_id)
    if configs:
        try:
            await notify(schedule, dataset, new_version, delta, configs)
        except Exception as e:
            logger.error("Notification failed for checkpoint %s: %s", schedule_id, e)

    storage_backend.update_checkpoint_schedule_status(
        schedule_id, datetime.now(), "changed"
    )

    summary = delta.get("summary", "Changes detected")
    logger.info(
        "Checkpoint %s: %s (v%d saved, %d pruned)",
        schedule_id, summary, new_version, pruned,
    )
    return {
        "schedule_id": schedule_id,
        "status": "changed",
        "version": new_version,
        "summary": summary,
        "pruned": pruned,
    }


def _patch_checkpoint_flag(storage_backend, dataset_id: str, version: int):
    """
    Mark a specific dataset version as checkpoint=True.

    The standard update_dataset doesn't expose the checkpoint field (it's scheduler-only),
    so we patch the stored document directly via the backend's low-level interface.
    """
    from terranova.models import TerranovaVersion
    v = TerranovaVersion(version=version)  # type: ignore[call-arg]
    docs = storage_backend.get_datasets(dataset_id=dataset_id, version=v)
    if not docs:
        return
    doc = dict(docs[0])
    doc["checkpoint"] = True

    # SQLite: scan by datasetId then exact-match on version after parsing JSON
    if hasattr(storage_backend, 'conn'):
        import json
        cursor = storage_backend.conn.cursor()
        cursor.execute(
            "SELECT id, document FROM dataset WHERE document LIKE ?",
            (f'%"datasetId": "{dataset_id}"%',),
        )
        rows = cursor.fetchall()
        for row_id, doc_json in rows:
            parsed = json.loads(doc_json)
            if parsed.get("datasetId") == dataset_id and parsed.get("version") == version:
                parsed["checkpoint"] = True
                cursor.execute(
                    "UPDATE dataset SET document = ? WHERE id = ?",
                    (json.dumps(parsed, default=str), row_id),
                )
        storage_backend.conn.commit()
    else:
        # Elasticsearch: use the update method
        from terranova.settings import ELASTIC_INDICES
        # Find the ES doc id for this version
        results = storage_backend.query(
            ELASTIC_INDICES["dataset"]["read"],
            {"bool": {"filter": [
                {"term": {"datasetId": dataset_id}},
                {"term": {"version": version}},
            ]}},
        )
        if results:
            storage_backend.es.update(
                index=ELASTIC_INDICES["dataset"]["write"],
                id=results[0].get("_id", ""),
                body={"doc": {"checkpoint": True}},
            )
