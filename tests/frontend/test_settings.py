"""
Tests for anything settings related in Terranova, including user creation and dynamic google sheet datasources.
"""

import random

from playwright.sync_api import expect
import pytest
import re
from tests.frontend.conftest import AUTH_BACKEND


@pytest.mark.skipif(AUTH_BACKEND != "basic", reason="requires basic auth")
def test_change_name(page, create_test_user):
    user_row = page.get_by_role("row", name=create_test_user)
    user_table = page.locator("#table-form")
    user_row.get_by_role("button", name="Edit user").click()

    CHANGED_NAME = "Edited Test Name: " + str(random.randint(0, 1000))
    user_row.locator('input[name="name"]').fill(CHANGED_NAME)
    CHANGED_ROLE = "Read/Write"
    user_row.get_by_role("combobox").click()
    page.get_by_role("option", name=CHANGED_ROLE).click()
    page.get_by_role("button", name="Save changes").click()
    expect(user_table).to_contain_text(CHANGED_NAME)
    expect(user_table).to_contain_text(CHANGED_ROLE)
    # ensure persistence
    page.reload()
    expect(user_table).to_be_visible()
    expect(user_table).to_contain_text(CHANGED_NAME)
    expect(user_table).to_contain_text(CHANGED_ROLE)


@pytest.mark.skipif(AUTH_BACKEND != "basic", reason="requires basic auth")
def test_delete_user(page, create_test_user):
    user_row = page.get_by_role("row", name=create_test_user)
    user_table = page.locator("#table-form")
    expect(user_table).to_be_visible()

    user_row.get_by_role("button", name="Delete user").click()
    expect(page.get_by_role("dialog", name="confirmation-modal")).to_be_visible()
    page.get_by_role("button", name="Deletion").click()
    expect(page.locator("#table-form")).not_to_contain_text(create_test_user)


@pytest.mark.skipif(AUTH_BACKEND != "basic", reason="requires basic auth")
def test_reset_password(page, create_test_user):
    user_row = page.get_by_role("row", name=create_test_user)
    user_table = page.locator("#table-form")
    expect(user_table).to_be_visible()

    user_row.get_by_role("button", name="Reset").click()

    user_row.locator('input[name="password"]').fill("Test Reset Password")
    user_row.get_by_role("button", name="Update password").click()

    expect(user_row.get_by_role("button", name="Reset")).to_be_visible()
