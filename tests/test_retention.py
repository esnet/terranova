import pytest
import tempfile
import os
from terranova.backends.sqlite import SQLiteBackend
from terranova.backends.auth import User
from terranova.models import (
    DatasetRevision,
    DatasetQuery,
    RetentionPolicy,
)
from terranova.checkpoint.retention import apply_retention


@pytest.fixture
def backend():
    temp_fd, temp_path = tempfile.mkstemp(suffix=".db")
    os.close(temp_fd)
    b = SQLiteBackend(db_path=temp_path)
    yield b
    if hasattr(b, '_local') and hasattr(b._local, 'conn'):
        b._local.conn.close()
    if os.path.exists(temp_path):
        os.remove(temp_path)


@pytest.fixture
def user():
    return User(name="Tester", email="t@example.com", username="tester", scope=["read", "write"])


def _make_dataset(backend, user, name="DS"):
    revision = DatasetRevision(name=name, query=DatasetQuery(endpoint="google_sheets", filters=[]))
    result = backend.create_dataset(revision, user)
    return result["object"]["datasetId"]


def _add_checkpoints(backend, user, dataset_id, count):
    """Add `count` checkpoint snapshots to dataset_id."""
    for _ in range(count):
        backend.create_snapshot(dataset_id, [], "checkpoint", user)


def _checkpoint_snaps(backend, dataset_id):
    return backend.get_snapshots(dataset_id, snapshot_type="checkpoint", limit=10000)


def _user_snaps(backend, dataset_id):
    return backend.get_snapshots(dataset_id, snapshot_type="user_save", limit=10000)


class TestRetention:
    def test_no_policy_no_pruning(self, backend, user):
        dataset_id = _make_dataset(backend, user)
        _add_checkpoints(backend, user, dataset_id, 20)
        deleted = apply_retention(dataset_id, RetentionPolicy(), backend)
        assert deleted == 0

    def test_keep_last_n(self, backend, user):
        dataset_id = _make_dataset(backend, user)
        _add_checkpoints(backend, user, dataset_id, 20)

        deleted = apply_retention(dataset_id, RetentionPolicy(keep_last_n=5), backend)

        remaining = _checkpoint_snaps(backend, dataset_id)
        assert len(remaining) == 5
        assert deleted == 15

    def test_user_saves_never_pruned(self, backend, user):
        dataset_id = _make_dataset(backend, user)
        # Create a user_save snapshot
        backend.create_snapshot(dataset_id, [], "user_save", user, version=1)
        # Add 20 checkpoint snapshots
        _add_checkpoints(backend, user, dataset_id, 20)

        apply_retention(dataset_id, RetentionPolicy(keep_last_n=3), backend)

        user_saves = _user_snaps(backend, dataset_id)
        assert len(user_saves) == 1  # user save survives

    def test_keep_every_nth(self, backend, user):
        dataset_id = _make_dataset(backend, user)
        _add_checkpoints(backend, user, dataset_id, 20)

        policy = RetentionPolicy(keep_last_n=5, keep_every_nth=5)
        apply_retention(dataset_id, policy, backend)

        remaining = _checkpoint_snaps(backend, dataset_id)
        # Last 5 kept + every 5th of the older 15 (indices 0, 5, 10 = 3 more)
        assert len(remaining) == 8

    def test_no_checkpoint_versions_no_pruning(self, backend, user):
        dataset_id = _make_dataset(backend, user)
        # Only user saves
        for i in range(5):
            backend.create_snapshot(dataset_id, [], "user_save", user, version=i + 1)

        deleted = apply_retention(dataset_id, RetentionPolicy(keep_last_n=2), backend)
        assert deleted == 0

    def test_fewer_versions_than_keep_n(self, backend, user):
        dataset_id = _make_dataset(backend, user)
        _add_checkpoints(backend, user, dataset_id, 3)

        deleted = apply_retention(dataset_id, RetentionPolicy(keep_last_n=10), backend)
        assert deleted == 0
        assert len(_checkpoint_snaps(backend, dataset_id)) == 3

    def test_protected_snapshots_never_pruned(self, backend, user):
        """Snapshots referenced by dataset pointers are protected even if keep_last_n would prune them."""
        dataset_id = _make_dataset(backend, user)
        snaps = [backend.create_snapshot(dataset_id, [], "checkpoint", user) for _ in range(5)]
        # Mark the oldest as latestCheckpointId and acknowledgedCheckpointId
        oldest_id = snaps[0]["snapshotId"]
        backend.update_dataset_pointers(
            dataset_id,
            latest_checkpoint_id=snaps[-1]["snapshotId"],
            acknowledged_checkpoint_id=oldest_id,
        )
        # keep_last_n=1 would normally remove snaps[0]-snaps[3]
        apply_retention(dataset_id, RetentionPolicy(keep_last_n=1), backend)
        remaining_ids = {s["snapshotId"] for s in _checkpoint_snaps(backend, dataset_id)}
        # oldest and newest must both survive (protected by pointers)
        assert oldest_id in remaining_ids
        assert snaps[-1]["snapshotId"] in remaining_ids
