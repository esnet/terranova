"""
Tests for the notifications module using mock SMTP and Slack webhook.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch


SCHEDULE = {
    "scheduleId": "SCHED01",
    "name": "Hourly topology check",
    "datasetId": "DS00001",
}

DATASET = {
    "datasetId": "DS00001",
    "name": "Core Circuits",
}

DELTA = {
    "changed": True,
    "summary": "2 nodes added, 1 edge removed",
    "nodes": {"added": [{"endpoint_id": "NYC"}], "removed": []},
    "edges": {"added": [], "removed": [{"src": "SEA", "dst": "LAX"}]},
}

FROM_SNAP = "snap_from_001"
TO_SNAP   = "snap_to_002"


@pytest.fixture(autouse=True)
def patch_settings(monkeypatch):
    monkeypatch.setattr("terranova.checkpoint.notifications.NOTIFICATIONS_SMTP_HOST", "smtp.test.local")
    monkeypatch.setattr("terranova.checkpoint.notifications.NOTIFICATIONS_SMTP_PORT", 587)
    monkeypatch.setattr("terranova.checkpoint.notifications.NOTIFICATIONS_SMTP_USER", "user")
    monkeypatch.setattr("terranova.checkpoint.notifications.NOTIFICATIONS_SMTP_PASS", "pass")
    monkeypatch.setattr("terranova.checkpoint.notifications.NOTIFICATIONS_SMTP_FROM", "tn@test.local")
    monkeypatch.setattr("terranova.checkpoint.notifications.NOTIFICATIONS_SLACK_WEBHOOK_URL", None)
    monkeypatch.setattr("terranova.checkpoint.notifications.NOTIFICATIONS_BASE_URL", "https://terranova.test")


class TestEmailNotification:
    @pytest.mark.asyncio
    async def test_email_sent_with_correct_fields(self):
        from terranova.checkpoint import notifications

        with patch("smtplib.SMTP") as mock_smtp_cls:
            mock_smtp = MagicMock()
            mock_smtp_cls.return_value.__enter__ = MagicMock(return_value=mock_smtp)
            mock_smtp_cls.return_value.__exit__ = MagicMock(return_value=False)

            await notifications.send_email(
                recipients=["ops@test.local"],
                schedule_name=SCHEDULE["name"],
                dataset_name=DATASET["name"],
                dataset_id=DATASET["datasetId"],
                from_snapshot_id=FROM_SNAP,
                to_snapshot_id=TO_SNAP,
                delta=DELTA,
            )

            mock_smtp.sendmail.assert_called_once()
            call_args = mock_smtp.sendmail.call_args
            assert "ops@test.local" in call_args[0][1]
            message_str = call_args[0][2]
            assert "Hourly topology check" in message_str
            assert "2 nodes added, 1 edge removed" in message_str

    @pytest.mark.asyncio
    async def test_email_skipped_when_no_smtp_host(self, monkeypatch):
        from terranova.checkpoint import notifications
        monkeypatch.setattr(notifications, "NOTIFICATIONS_SMTP_HOST", None)

        with patch("smtplib.SMTP") as mock_smtp_cls:
            await notifications.send_email(
                recipients=["ops@test.local"],
                schedule_name="test",
                dataset_name="DS",
                dataset_id="DS1",
                from_snapshot_id=None,
                to_snapshot_id="snap1",
                delta=DELTA,
            )
            mock_smtp_cls.assert_not_called()

    @pytest.mark.asyncio
    async def test_email_skipped_when_no_recipients(self):
        from terranova.checkpoint import notifications

        with patch("smtplib.SMTP") as mock_smtp_cls:
            await notifications.send_email(
                recipients=[],
                schedule_name="test",
                dataset_name="DS",
                dataset_id="DS1",
                from_snapshot_id=None,
                to_snapshot_id="snap1",
                delta=DELTA,
            )
            mock_smtp_cls.assert_not_called()

    @pytest.mark.asyncio
    async def test_email_contains_review_link(self):
        from terranova.checkpoint import notifications

        with patch("smtplib.SMTP") as mock_smtp_cls:
            mock_smtp = MagicMock()
            mock_smtp_cls.return_value.__enter__ = MagicMock(return_value=mock_smtp)
            mock_smtp_cls.return_value.__exit__ = MagicMock(return_value=False)

            await notifications.send_email(
                recipients=["a@b.com"],
                schedule_name="S",
                dataset_name="D",
                dataset_id="DSXYZ",
                from_snapshot_id=FROM_SNAP,
                to_snapshot_id=TO_SNAP,
                delta=DELTA,
            )
            message_str = mock_smtp.sendmail.call_args[0][2]
            assert "https://terranova.test/dataset/DSXYZ" in message_str
            assert f"diffTo={TO_SNAP}" in message_str
            assert f"diffFrom={FROM_SNAP}" in message_str


class TestSlackNotification:
    @pytest.mark.asyncio
    async def test_slack_block_kit_payload(self):
        from terranova.checkpoint import notifications

        with patch("httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)
            mock_resp = MagicMock()
            mock_resp.raise_for_status = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_resp)

            await notifications.send_slack(
                webhook_url="https://hooks.slack.com/test",
                schedule_name=SCHEDULE["name"],
                dataset_name=DATASET["name"],
                dataset_id=DATASET["datasetId"],
                from_snapshot_id=FROM_SNAP,
                to_snapshot_id=TO_SNAP,
                delta=DELTA,
            )

            mock_client.post.assert_called_once()
            call_kwargs = mock_client.post.call_args[1]
            payload = call_kwargs["json"]

            assert "blocks" in payload
            block_texts = str(payload["blocks"])
            assert "Hourly topology check" in block_texts
            assert "Core Circuits" in block_texts
            assert "2 nodes added" in block_texts
            assert f"diffTo={TO_SNAP}" in block_texts

    @pytest.mark.asyncio
    async def test_notify_dispatches_to_configs(self):
        from terranova.checkpoint import notifications

        configs = [
            {"emailRecipients": ["a@b.com"], "slackWebhookUrl": "https://hooks.slack.com/x"},
        ]

        with patch.object(notifications, "send_email", new=AsyncMock()) as mock_email, \
             patch.object(notifications, "send_slack", new=AsyncMock()) as mock_slack:

            await notifications.notify(SCHEDULE, DATASET, TO_SNAP, FROM_SNAP, DELTA, configs)

            mock_email.assert_called_once()
            mock_slack.assert_called_once()

    @pytest.mark.asyncio
    async def test_notify_uses_global_slack_fallback(self, monkeypatch):
        from terranova.checkpoint import notifications
        monkeypatch.setattr(notifications, "NOTIFICATIONS_SLACK_WEBHOOK_URL",
                            "https://hooks.slack.com/global")

        configs = [{"emailRecipients": [], "slackWebhookUrl": None}]

        with patch.object(notifications, "send_slack", new=AsyncMock()) as mock_slack:
            await notifications.notify(SCHEDULE, DATASET, TO_SNAP, FROM_SNAP, DELTA, configs)
            mock_slack.assert_called_once()
            # First positional arg is webhook_url
            assert mock_slack.call_args[0][0] == "https://hooks.slack.com/global"
