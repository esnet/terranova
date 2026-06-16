import pytest
import tempfile
import os
from terranova.backends.sqlite import SQLiteBackend
from terranova.backends.auth import User
from terranova.models import (
    CheckpointScheduleRevision,
    NotificationConfigRevision,
    RetentionPolicy,
    TerranovaNotFoundException,
    DatasetRevision,
    DatasetQuery,
)
from terranova.abstract_models import QueryFilter


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


@pytest.fixture
def dataset_id(backend, user):
    """Create a dataset and return its ID."""
    revision = DatasetRevision(
        name="Test Dataset",
        query=DatasetQuery(endpoint="google_sheets", filters=[]),
    )
    result = backend.create_dataset(revision, user)
    return result["object"]["datasetId"]


@pytest.fixture
def schedule_revision(dataset_id):
    return CheckpointScheduleRevision(
        datasetId=dataset_id,
        name="Hourly check",
        intervalMinutes=60,
        enabled=True,
        retention=RetentionPolicy(keep_last_n=10, keep_every_nth=5),
    )


class TestCheckpointScheduleCRUD:
    def test_create_schedule(self, backend, user, schedule_revision):
        doc = backend.create_checkpoint_schedule(schedule_revision, user)
        assert doc["scheduleId"]
        assert doc["datasetId"] == schedule_revision.datasetId
        assert doc["intervalMinutes"] == 60
        assert doc["enabled"] is True
        assert doc["retention"]["keep_last_n"] == 10
        assert doc["createdBy"] == "tester"

    def test_get_schedule_by_id(self, backend, user, schedule_revision):
        doc = backend.create_checkpoint_schedule(schedule_revision, user)
        result = backend.get_checkpoint_schedules(schedule_id=doc["scheduleId"])
        assert len(result) == 1
        assert result[0]["scheduleId"] == doc["scheduleId"]

    def test_get_schedules_by_dataset(self, backend, user, schedule_revision):
        backend.create_checkpoint_schedule(schedule_revision, user)
        result = backend.get_checkpoint_schedules(dataset_id=schedule_revision.datasetId)
        assert len(result) >= 1
        assert all(r["datasetId"] == schedule_revision.datasetId for r in result)

    def test_update_schedule(self, backend, user, schedule_revision):
        doc = backend.create_checkpoint_schedule(schedule_revision, user)
        updated_revision = CheckpointScheduleRevision(
            datasetId=schedule_revision.datasetId,
            name="Updated name",
            intervalMinutes=120,
            enabled=False,
            retention=RetentionPolicy(keep_last_n=20),
        )
        updated = backend.update_checkpoint_schedule(doc["scheduleId"], updated_revision, user)
        assert updated["name"] == "Updated name"
        assert updated["intervalMinutes"] == 120
        assert updated["enabled"] is False
        assert updated["retention"]["keep_last_n"] == 20

    def test_update_nonexistent_schedule_raises(self, backend, user, schedule_revision):
        with pytest.raises(TerranovaNotFoundException):
            backend.update_checkpoint_schedule("NOSUCH", schedule_revision, user)

    def test_delete_schedule(self, backend, user, schedule_revision):
        doc = backend.create_checkpoint_schedule(schedule_revision, user)
        backend.delete_checkpoint_schedule(doc["scheduleId"])
        result = backend.get_checkpoint_schedules(schedule_id=doc["scheduleId"])
        assert result == []

    def test_update_schedule_status(self, backend, user, schedule_revision):
        from datetime import datetime
        doc = backend.create_checkpoint_schedule(schedule_revision, user)
        now = datetime.now()
        backend.update_checkpoint_schedule_status(doc["scheduleId"], now, "changed")
        updated = backend.get_checkpoint_schedules(schedule_id=doc["scheduleId"])[0]
        assert updated["lastRunStatus"] == "changed"
        assert updated["lastRunOn"] is not None

    def test_update_status_with_error(self, backend, user, schedule_revision):
        from datetime import datetime
        doc = backend.create_checkpoint_schedule(schedule_revision, user)
        backend.update_checkpoint_schedule_status(
            doc["scheduleId"], datetime.now(), "error", last_error="Connection refused"
        )
        updated = backend.get_checkpoint_schedules(schedule_id=doc["scheduleId"])[0]
        assert updated["lastRunStatus"] == "error"
        assert updated["lastError"] == "Connection refused"


class TestNotificationConfigCRUD:
    @pytest.fixture
    def schedule_id(self, backend, user, schedule_revision):
        doc = backend.create_checkpoint_schedule(schedule_revision, user)
        return doc["scheduleId"]

    @pytest.fixture
    def notif_revision(self, schedule_id):
        return NotificationConfigRevision(
            scheduleId=schedule_id,
            emailRecipients=["ops@example.com", "noc@example.com"],
            slackWebhookUrl="https://hooks.slack.com/services/TEST",
        )

    def test_create_notification_config(self, backend, user, notif_revision):
        doc = backend.create_notification_config(notif_revision, user)
        assert doc["configId"]
        assert doc["emailRecipients"] == ["ops@example.com", "noc@example.com"]
        assert doc["slackWebhookUrl"] == "https://hooks.slack.com/services/TEST"
        assert doc["createdBy"] == "tester"

    def test_get_config_by_id(self, backend, user, notif_revision):
        doc = backend.create_notification_config(notif_revision, user)
        result = backend.get_notification_configs(config_id=doc["configId"])
        assert len(result) == 1
        assert result[0]["configId"] == doc["configId"]

    def test_get_configs_by_schedule(self, backend, user, notif_revision, schedule_id):
        backend.create_notification_config(notif_revision, user)
        result = backend.get_notification_configs(schedule_id=schedule_id)
        assert len(result) >= 1

    def test_update_notification_config(self, backend, user, notif_revision):
        doc = backend.create_notification_config(notif_revision, user)
        updated_revision = NotificationConfigRevision(
            scheduleId=notif_revision.scheduleId,
            emailRecipients=["new@example.com"],
            slackWebhookUrl=None,
        )
        updated = backend.update_notification_config(doc["configId"], updated_revision, user)
        assert updated["emailRecipients"] == ["new@example.com"]
        assert updated["slackWebhookUrl"] is None

    def test_update_nonexistent_config_raises(self, backend, user, notif_revision):
        with pytest.raises(TerranovaNotFoundException):
            backend.update_notification_config("NOSUCH", notif_revision, user)

    def test_delete_notification_config(self, backend, user, notif_revision):
        doc = backend.create_notification_config(notif_revision, user)
        backend.delete_notification_config(doc["configId"])
        result = backend.get_notification_configs(config_id=doc["configId"])
        assert result == []


class TestSnapshotOperations:
    def test_snapshot_types_stored_correctly(self, backend, user, dataset_id):
        """Snapshot type is stored and retrieved correctly."""
        snap = backend.create_snapshot(dataset_id, [], "user_save", user, version=1)
        assert snap["snapshotType"] == "user_save"
        assert snap["version"] == 1

        ckpt = backend.create_snapshot(dataset_id, [], "checkpoint", user)
        assert ckpt["snapshotType"] == "checkpoint"
        assert ckpt["version"] is None

    def test_delete_snapshot(self, backend, user, dataset_id):
        """delete_snapshot removes exactly that snapshot."""
        s1 = backend.create_snapshot(dataset_id, [], "checkpoint", user)
        s2 = backend.create_snapshot(dataset_id, [], "checkpoint", user)

        snaps_before = backend.get_snapshots(dataset_id)
        assert len(snaps_before) == 2

        backend.delete_snapshot(s1["snapshotId"])
        snaps_after = backend.get_snapshots(dataset_id)
        assert len(snaps_after) == 1
        assert snaps_after[0]["snapshotId"] == s2["snapshotId"]

    def test_delete_snapshot_does_not_affect_other_datasets(self, backend, user, dataset_id):
        """Deleting a snapshot of one dataset doesn't touch another."""
        revision = DatasetRevision(
            name="Other Dataset",
            query=DatasetQuery(endpoint="google_sheets", filters=[]),
        )
        other = backend.create_dataset(revision, user)
        other_id = other["object"]["datasetId"]

        snap_other = backend.create_snapshot(other_id, [], "checkpoint", user)
        snap_this = backend.create_snapshot(dataset_id, [], "checkpoint", user)

        backend.delete_snapshot(snap_this["snapshotId"])

        other_snaps = backend.get_snapshots(other_id)
        assert len(other_snaps) == 1
        assert other_snaps[0]["snapshotId"] == snap_other["snapshotId"]
