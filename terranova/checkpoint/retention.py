"""
Retention policy enforcement for checkpoint dataset versions.

Only versions with checkpoint=True are candidates for pruning.
User saves (checkpoint=None/False) are never touched.
"""
from terranova.models import RetentionPolicy, TerranovaVersion


def apply_retention(dataset_id: str, policy: RetentionPolicy, storage_backend) -> int:
    """
    Apply a RetentionPolicy to the checkpoint versions of a dataset.

    Returns the number of versions deleted.
    """
    if not policy.keep_last_n and not policy.keep_every_nth:
        return 0

    all_v = TerranovaVersion(version="all")  # type: ignore[call-arg]
    all_versions = storage_backend.get_datasets(dataset_id=dataset_id, version=all_v)

    # Only consider checkpoint versions; sort descending by version number
    checkpoint_versions = sorted(
        [v for v in all_versions if v.get("checkpoint")],
        key=lambda v: v["version"],
        reverse=True,
    )

    if not checkpoint_versions:
        return 0

    to_keep: set[int] = set()

    # Always keep the N most recent checkpoint versions
    keep_n = policy.keep_last_n or 0
    for v in checkpoint_versions[:keep_n]:
        to_keep.add(v["version"])

    # Among the rest, keep every Nth by version number (oldest-first thinning)
    if policy.keep_every_nth and policy.keep_every_nth > 0:
        older = checkpoint_versions[keep_n:]
        # Reverse so we thin oldest-first with stable intervals
        older_asc = list(reversed(older))
        for i, v in enumerate(older_asc):
            if i % policy.keep_every_nth == 0:
                to_keep.add(v["version"])

    deleted = 0
    for v in checkpoint_versions:
        if v["version"] not in to_keep:
            storage_backend.delete_dataset_version(dataset_id, v["version"])
            deleted += 1

    return deleted
