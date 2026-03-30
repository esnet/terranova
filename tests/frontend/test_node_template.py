"""
Tests for anything node template related in Terranova.
"""

from playwright.sync_api import expect
import re


def test_create_node_template(page, create_test_node):
    """Tests that the create fixture works."""
    pass


def test_edit_node_template(page, create_test_node):
    EDITED_NAME = "Update Node Template"
    EDITED_SVG = "test"
    page.get_by_role("textbox", name="Name").fill(EDITED_NAME)
    page.get_by_role("textbox", name="SVG Code").fill(EDITED_SVG)
    expect(page.get_by_role("button", name="Save Changes")).not_to_be_disabled()
    page.get_by_role("button", name="Save Changes").click()
    expect(page.get_by_role("main")).to_contain_text("Node Template Saved")
    page.wait_for_timeout(1000)
    page.reload()
    expect(page.get_by_role("textbox", name="SVG Code")).to_have_value(EDITED_SVG)
    expect(page.get_by_role("textbox", name="Name")).to_have_value(EDITED_NAME)
