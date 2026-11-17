import pytest
import tempfile
import os
from terranova.backends.sqlite import SQLiteBackend
from terranova.backends.auth import User
from terranova.models import (
    DatasetRevision,
    DatasetQuery,
    RetentionPolicy,
    TerranovaVersion,
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


def _add_versions(backend, user, dataset_id, count, checkpoint=True):
    """Add `count` additional versions to dataset_id."""
    revision = DatasetRevision(
        name="DS", query=DatasetQuery(endpoint="google_sheets", filters=[])
    )
    for _ in range(count):
        backend.update_dataset(dataset_id, revision, [], user)
    if checkpoint:
        # Tag all versions beyond v1 as checkpoint
        all_v = TerranovaVersion(version="all")
        for doc in backend.get_datasets(dataset_id=dataset_id, version=all_v):
            if doc["version"] > 1:
                from terranova.checkpoint.scheduler import _patch_checkpoint_flag
                _patch_checkpoint_flag(backend, dataset_id, doc["version"])


def _checkpoint_versions(backend, dataset_id):
    all_v = TerranovaVersion(version="all")
    return [d for d in backend.get_datasets(dataset_id=dataset_id, version=all_v)
            if d.get("checkpoint")]


def _user_versions(backend, dataset_id):
    all_v = TerranovaVersion(version="all")
    return [d for d in backend.get_datasets(dataset_id=dataset_id, version=all_v)
            if not d.get("checkpoint")]


class TestRetention:
    def test_no_policy_no_pruning(self, backend, user):
        dataset_id = _make_dataset(backend, user)
        _add_versions(backend, user, dataset_id, 20)
        deleted = apply_retention(dataset_id, RetentionPolicy(), backend)
        assert deleted == 0

    def test_keep_last_n(self, backend, user):
        dataset_id = _make_dataset(backend, user)
        _add_versions(backend, user, dataset_id, 20)  # versions 2-21, all checkpoint

        deleted = apply_retention(dataset_id, RetentionPolicy(keep_last_n=5), backend)

        remaining = _checkpoint_versions(backend, dataset_id)
        assert len(remaining) == 5
        # The 5 most recent should be kept
        version_nums = sorted(v["version"] for v in remaining)
        assert version_nums == list(range(17, 22))  # v17..v21
        assert deleted == 15

    def test_user_saves_never_pruned(self, backend, user):
        dataset_id = _make_dataset(backend, user)
        # v1 is a user save; add 20 checkpoint versions
        _add_versions(backend, user, dataset_id, 20)

        apply_retention(dataset_id, RetentionPolicy(keep_last_n=3), backend)

        user_saves = _user_versions(backend, dataset_id)
        assert len(user_saves) == 1  # v1 survives

    def test_keep_every_nth(self, backend, user):
        dataset_id = _make_dataset(backend, user)
        _add_versions(backend, user, dataset_id, 20)  # v2..v21

        policy = RetentionPolicy(keep_last_n=5, keep_every_nth=5)
        apply_retention(dataset_id, policy, backend)

        remaining = _checkpoint_versions(backend, dataset_id)
        version_nums = sorted(v["version"] for v in remaining)

        # Last 5 kept: v17-v21
        # Remaining older: v2-v16 (15 versions), thinned to every 5th (oldest-first)
        # In ascending order: v2,v3,...v16 → indices 0,1,...14
        # Keep index 0,5,10 → v2, v7, v12
        for v in [17, 18, 19, 20, 21]:  # last 5
            assert v in version_nums
        for v in [2, 7, 12]:  # every 5th of older
            assert v in version_nums
        # Mid-versions should be gone
        for v in [3, 4, 5, 6, 8, 9, 10, 11, 13, 14, 15, 16]:
            assert v not in version_nums

    def test_no_checkpoint_versions_no_pruning(self, backend, user):
        dataset_id = _make_dataset(backend, user)
        # Only user saves, no checkpoint flag
        revision = DatasetRevision(name="DS", query=DatasetQuery(endpoint="google_sheets", filters=[]))
        for _ in range(5):
            backend.update_dataset(dataset_id, revision, [], user)

        deleted = apply_retention(dataset_id, RetentionPolicy(keep_last_n=2), backend)
        assert deleted == 0

    def test_fewer_versions_than_keep_n(self, backend, user):
        dataset_id = _make_dataset(backend, user)
        _add_versions(backend, user, dataset_id, 3)

        deleted = apply_retention(dataset_id, RetentionPolicy(keep_last_n=10), backend)
        assert deleted == 0
        assert len(_checkpoint_versions(backend, dataset_id)) == 3
