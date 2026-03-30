"""
Tests for anything node template related in Terranova.
"""

from playwright.sync_api import expect
import re
from urls import FRONTEND_BASE


def test_create_node_template(page, login):
    # Navigate to template creation via the "Create new node template" button on the home page
    page.get_by_role("button", name="Create new node template").click()
    expect(page).to_have_url(re.compile(r".*/template/new"), timeout=5000)

    page.get_by_role("textbox", name="Name").fill("Create Node Template Test")
    page.get_by_role("textbox", name="SVG Code").fill(
        '<rect x="-4" y="-4" width="8" height="8" /><text x="8" y="3" fill="#0088b5" stroke="none" style="font-size:12px;">test</text>'
    )
    page.get_by_role("button", name="Create", exact=True).click()

    # After creation: URL changes to /template/{id} and "Node Template Builder" is visible in TemplatePreview
    expect(page).to_have_url(re.compile(r".*/template/\w{7}$"), timeout=10000)
    expect(page.get_by_role("main")).to_contain_text("Node Template Builder")
