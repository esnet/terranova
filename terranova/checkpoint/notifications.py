"""
Email and Slack notification senders for checkpoint change events.
"""
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import httpx

from terranova.settings import (
    NOTIFICATIONS_SMTP_HOST,
    NOTIFICATIONS_SMTP_PORT,
    NOTIFICATIONS_SMTP_USER,
    NOTIFICATIONS_SMTP_PASS,
    NOTIFICATIONS_SMTP_FROM,
    NOTIFICATIONS_SLACK_WEBHOOK_URL,
    NOTIFICATIONS_BASE_URL,
)

logger = logging.getLogger(__name__)


def _dataset_diff_url(dataset_id: str, from_snapshot_id: str | None, to_snapshot_id: str) -> str:
    """Deep-link URL that opens the dataset editor with the diff picker pre-populated."""
    base = NOTIFICATIONS_BASE_URL.rstrip("/")
    url = f"{base}/dataset/{dataset_id}?diffTo={to_snapshot_id}"
    if from_snapshot_id:
        url += f"&diffFrom={from_snapshot_id}"
    return url


def _email_body(
    schedule_name: str, dataset_name: str,
    dataset_id: str, from_snapshot_id: str | None, to_snapshot_id: str, delta: dict,
) -> tuple[str, str]:
    url = _dataset_diff_url(dataset_id, from_snapshot_id, to_snapshot_id)
    summary = delta.get("summary", "Changes detected")
    subject = f"[Terranova] Topology change detected: {schedule_name}"
    body = f"""\
Terranova detected a change in dataset "{dataset_name}" monitored by schedule "{schedule_name}".

Summary: {summary}

Review the changes here:
{url}

---
This notification was sent automatically by the Terranova checkpoint system.
"""
    return subject, body


async def send_email(
    recipients: list[str],
    schedule_name: str,
    dataset_name: str,
    dataset_id: str,
    from_snapshot_id: str | None,
    to_snapshot_id: str,
    delta: dict,
):
    if not NOTIFICATIONS_SMTP_HOST:
        logger.warning("SMTP not configured; skipping email notification")
        return
    if not recipients:
        return

    subject, body = _email_body(schedule_name, dataset_name, dataset_id, from_snapshot_id, to_snapshot_id, delta)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = NOTIFICATIONS_SMTP_FROM
    msg["To"] = ", ".join(recipients)
    msg.attach(MIMEText(body, "plain"))

    try:
        with smtplib.SMTP(NOTIFICATIONS_SMTP_HOST, NOTIFICATIONS_SMTP_PORT) as smtp:
            smtp.ehlo()
            smtp.starttls()
            if NOTIFICATIONS_SMTP_USER and NOTIFICATIONS_SMTP_PASS:
                smtp.login(NOTIFICATIONS_SMTP_USER, NOTIFICATIONS_SMTP_PASS)
            smtp.sendmail(NOTIFICATIONS_SMTP_FROM, recipients, msg.as_string())
        logger.info("Email notification sent to %s", recipients)
    except Exception as e:
        logger.error("Failed to send email notification: %s", e)


async def send_slack(
    webhook_url: str,
    schedule_name: str,
    dataset_name: str,
    dataset_id: str,
    from_snapshot_id: str | None,
    to_snapshot_id: str,
    delta: dict,
):
    url = _dataset_diff_url(dataset_id, from_snapshot_id, to_snapshot_id)
    summary = delta.get("summary", "Changes detected")

    payload = {
        "blocks": [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"Topology change detected: {schedule_name}",
                },
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Dataset:* {dataset_name}\n*Changes:* {summary}",
                },
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "Review Changes"},
                        "url": url,
                        "style": "primary",
                    }
                ],
            },
        ]
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(webhook_url, json=payload, timeout=10)
            resp.raise_for_status()
        logger.info("Slack notification sent to webhook")
    except Exception as e:
        logger.error("Failed to send Slack notification: %s", e)


async def notify(
    schedule: dict,
    dataset: dict,
    to_snapshot_id: str,
    from_snapshot_id: str | None,
    delta: dict,
    notification_configs: list[dict],
):
    """
    Dispatch notifications for a detected change.

    from_snapshot_id: the last user_save snapshot (the "base" for the diff link)
    to_snapshot_id: the new checkpoint snapshot just created
    """
    dataset_id = dataset["datasetId"]
    dataset_name = dataset.get("name", dataset_id)
    schedule_name = schedule.get("name", schedule["scheduleId"])

    for config in notification_configs:
        recipients = config.get("emailRecipients") or []
        slack_url = config.get("slackWebhookUrl") or NOTIFICATIONS_SLACK_WEBHOOK_URL

        if recipients:
            await send_email(
                recipients, schedule_name, dataset_name,
                dataset_id, from_snapshot_id, to_snapshot_id, delta,
            )
        if slack_url:
            await send_slack(
                slack_url, schedule_name, dataset_name,
                dataset_id, from_snapshot_id, to_snapshot_id, delta,
            )
