"""
Retention policy enforcement for checkpoint snapshots.

Only checkpoint snapshots are candidates for pruning.
User saves are never touched.
"""
from terranova.models import RetentionPolicy


def apply_retention(dataset_id: str, policy: RetentionPolicy, storage_backend) -> int:
    """
    Apply a RetentionPolicy to the checkpoint snapshots of a dataset.

    Returns the number of snapshots deleted.
    """
    if not policy.keep_last_n and not policy.keep_every_nth:
        return 0

    # Get dataset pointers so we never delete a referenced snapshot
    datasets = storage_backend.get_datasets(dataset_id=dataset_id)
    if not datasets:
        return 0
    dataset = datasets[0]
    protected_ids = {
        dataset.get("currentSnapshotId"),
        dataset.get("latestCheckpointId"),
        dataset.get("acknowledgedCheckpointId"),
    } - {None}

    # Fetch all checkpoint snapshots, newest first
    checkpoint_snaps = storage_backend.get_snapshots(
        dataset_id, snapshot_type="checkpoint", limit=10000
    )

    if not checkpoint_snaps:
        return 0

    to_keep: set[str] = set(protected_ids)

    keep_n = policy.keep_last_n or 0
    for snap in checkpoint_snaps[:keep_n]:
        to_keep.add(snap["snapshotId"])

    if policy.keep_every_nth and policy.keep_every_nth > 0:
        older = checkpoint_snaps[keep_n:]
        older_asc = list(reversed(older))
        for i, snap in enumerate(older_asc):
            if i % policy.keep_every_nth == 0:
                to_keep.add(snap["snapshotId"])

    deleted = 0
    for snap in checkpoint_snaps:
        if snap["snapshotId"] not in to_keep:
            storage_backend.delete_snapshot(snap["snapshotId"])
            deleted += 1

    return deleted
