"""
Tests for anything node template related in Terranova.
"""

from playwright.sync_api import expect
import re
from urls import FRONTEND_BASE


def test_create_node_template(page, create_test_node):
    """Tests that the create fixture works."""
    pass


def test_edit_node_template(page, create_test_node):
    EDITED_NAME = "Update Node Template"
    EDITED_SVG = "test"
    # fill() bypasses React synthetic events on Pkts components; use
    # click(click_count=3) + keyboard.type which fires key events and
    # triggers onChange so the controller's instance is updated before save
    name_input = page.get_by_role("textbox", name="Name")
    name_input.click(click_count=3)
    page.keyboard.type(EDITED_NAME)
    svg_textarea = page.get_by_role("textbox", name="SVG Code")
    svg_textarea.click(click_count=3)
    page.keyboard.type(EDITED_SVG)
    expect(page.get_by_role("button", name="Save Changes")).not_to_be_disabled()
    page.get_by_role("button", name="Save Changes").click()
    expect(page.get_by_role("main")).to_contain_text("Node Template Saved")
    page.wait_for_timeout(1000)
    page.reload()
    expect(page.get_by_role("textbox", name="SVG Code")).to_have_value(EDITED_SVG, timeout=10000)
    expect(page.get_by_role("textbox", name="Name")).to_have_value(EDITED_NAME, timeout=10000)


def test_node_template_library(page, create_test_node):
    # Expect to see the default nodes created
    page.goto(f"{FRONTEND_BASE}/library/templates")
    expect(page.get_by_text("Node Template Library")).to_be_visible()
    expect(page.get_by_role("main")).to_contain_text("Geo: Simple - Circle")
    expect(page.get_by_role("main")).to_contain_text("Geo: Simple - Square")
    expect(page.get_by_role("main")).to_contain_text("Geo: Simple - Star")
    expect(page.get_by_role("main")).to_contain_text("Geo: Labelled - Circle")
    expect(page.get_by_role("main")).to_contain_text("Geo: Labelled - Square")
    expect(page.get_by_role("main")).to_contain_text("Geo: Labelled - Star")


def test_node_template_library_filter(page, create_test_node):
    page.goto(f"{FRONTEND_BASE}/library/templates")
    expect(page.get_by_text("Node Template Library")).to_be_visible()
    main = page.get_by_role("main")
    main.get_by_role("textbox", name="Filter by name...").fill("circle")
    expect(main.get_by_text("Geo: Simple - Circle")).to_be_visible()
    expect(main.get_by_text("Geo: Labelled - Circle")).to_be_visible()
    expect(main.get_by_text("Geo: Labelled - Square")).not_to_be_visible()
