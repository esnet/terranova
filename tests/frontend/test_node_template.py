"""
Tests for anything node template related in Terranova.
"""

from playwright.sync_api import expect
import re


def test_create_node_template(page, login):
    # unreliable way of clicking on the create dataset icon button
    page.get_by_role("textbox", name="Name").click()

    page.get_by_role("textbox", name="Name").fill("Create Node Template Test")
    page.get_by_role("textbox", name="SVG Code").click()
    page.get_by_role("textbox", name="SVG Code").fill(
        '<rect x="-4" y="-4" width="8" height="8" /><text x="8" y="3" fill="#0088b5" stroke="none" style="font-size:12px;">test</text>'
    )
    page.get_by_role("button", name="Create", exact=True).click()

    expect(page.get_by_role("main")).to_contain_text("Create Node Template Test")
    # template id expected to be of length 7
    expect(page).to_have_url(re.compile(r".*/template/\w{7}$"))
