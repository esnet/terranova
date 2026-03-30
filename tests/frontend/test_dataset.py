"""
Tests for anything dataset related in Terranova.
"""

from playwright.sync_api import expect
import re


def test_create_dataset(page, create_test_node):
    """Tests that the create fixture works."""
    pass


def test_create_forked_dataset(page, login):
    page.get_by_role("main").get_by_role("link", name="Datasets").click()
    page.get_by_role("button", name="Create New").click()
    expect(page.get_by_role("heading", name="Terranova")).to_be_visible()

    page.get_by_role("textbox", name="Name*").fill("Fork Dataset Test")
    page.get_by_role("checkbox", name="Fork Existing Dataset").check()
    expect(page.get_by_role("group", name="Fork Existing Dataset Options")).to_be_visible()

    page.get_by_role("textbox", name="Dataset Name*").click()
    page.get_by_role("option", name="Create Dataset Test").first.click()
    expect(page.locator("form")).to_contain_text("Create Dataset Test")

    page.get_by_role("textbox", name="Version*").click()
    page.get_by_role("option", name="v1").click()

    page.get_by_role("button", name="Create Dataset", exact=True).click()

    expect(page.get_by_role("main")).to_contain_text("Fork Dataset Test")
    expect(page).to_have_url(re.compile(r".*/dataset/\w{7}$"))


def test_dataset_discard_changes(page, create_test_dataset):
    # NOTE: This test requires a service account to be set up,
    # NOTE: the Terranova Network Toplogy Template to be shared with it
    # NOTE: and the cache to be filled. Otherwise, it will fail.

    expect(page.get_by_role("main")).to_contain_text("Current Version: 1")
    page.get_by_role("combobox").filter(has_text="Select data source").click()
    expect(page.get_by_role("option", name="Terranova Network Topology Template")).to_be_visible()
    page.get_by_role("option", name="Terranova Network Topology Template").click()

    page.get_by_role("button", name="Discard Changes").click()
    expect(page.get_by_role("main")).to_contain_text("Current Version: 1")


def test_dataset_query(page, create_test_dataset):
    # NOTE: This test requires a service account to be set up,
    # NOTE: the Terranova Network Toplogy Template to be shared with it
    # NOTE: and the cache to be filled. Otherwise, it will fail.

    expect(page.get_by_role("main")).to_contain_text("Current Version: 1")
    page.get_by_role("combobox").filter(has_text="Select data source").click()
    expect(page.get_by_role("option", name="Terranova Network Topology Template")).to_be_visible()
    page.get_by_role("option", name="Terranova Network Topology Template").click()
    page.wait_for_timeout(500)
    page.get_by_role("button", name="Add Query").click()
    page.wait_for_timeout(500)
    page.mouse.wheel(0, 400)
    # select name field
    page.get_by_role("combobox").filter(has_text="Field").click()
    page.get_by_role("option", name="Name", exact=True).click()
    # select two typeahead options
    page.get_by_role("textbox", name="Value").click()
    page.get_by_role("option", name="A--B").click()
    page.get_by_role("textbox", name="Value").click()
    page.get_by_role("option", name="A--Z").click()
    # assertions
    expect(page.locator("form")).to_contain_text("2 values")
    page.get_by_role("button", name="Save Changes").click()
    page.reload()
    expect(page.locator("form")).to_contain_text("2 values")
    expect(page.get_by_role("main")).to_contain_text("Current Version: 2")


def test_dataset_library(page, create_test_dataset):
    page.goto("localhost:5173/library/datasets")
    expect(page.get_by_text("Dataset Library")).to_be_visible()
    expect(page.get_by_role("link", name="Generated Test Dataset:").first).to_be_visible()


def test_dataset_library_filter(page, create_test_dataset):
    page.goto("localhost:5173/library/datasets")
    expect(page.get_by_text("Dataset Library")).to_be_visible()
    page.get_by_role("textbox", name="Filter by name...").fill("generate")
    expect(page.get_by_role("link", name="Generated Test Dataset:").first).to_be_visible()
