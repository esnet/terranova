"""
Tests for anything dataset related in Terranova.
"""

from playwright.sync_api import expect
import re
from urls import FRONTEND_BASE


def test_create_dataset(page, create_test_node):
    """Tests that the create fixture works."""
    pass


def test_create_forked_dataset(page, login):
    # Create the source dataset to fork from first (test is self-contained)
    source_name = "Fork Source Dataset"
    page.goto(f"{FRONTEND_BASE}/dataset/new")
    page.wait_for_load_state("networkidle")
    page.get_by_role("textbox", name="Name*").fill(source_name)
    page.get_by_role("button", name="Create Dataset").click()
    expect(page.get_by_role("main")).to_contain_text(source_name)

    # Navigate to the dataset creator to test forking
    page.goto(f"{FRONTEND_BASE}/dataset/new")
    expect(page.get_by_role("main")).to_contain_text("Create New Dataset")

    # Wait for dataset list to load before checking the fork switch.
    # Without this, datasetList is empty and the fork options show "no datasets".
    page.wait_for_load_state("networkidle")

    page.get_by_role("textbox", name="Name*").fill("Fork Dataset Test")
    page.get_by_role("checkbox", name="Fork Existing Dataset").check()
    expect(page.get_by_role("group", name="Fork Existing Dataset Options")).to_be_visible(timeout=10000)

    page.get_by_role("textbox", name="Dataset Name*").click()
    expect(page.get_by_role("listbox", name="Typeahead Dropdown Options")).to_be_visible()
    page.get_by_role("option", name=source_name).first.press("Enter")
    expect(page.locator("form")).to_contain_text(source_name)

    page.get_by_role("textbox", name="Version*").click()
    expect(page.get_by_role("listbox", name="Typeahead Dropdown Options")).to_be_visible()
    page.get_by_role("option", name="v1").first.click()
    expect(page.locator("form")).to_contain_text("v1")

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
    page.get_by_role("button", name="Add Criterion").click()
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
    page.goto(f"{FRONTEND_BASE}/library/datasets")
    expect(page.get_by_text("Dataset Library")).to_be_visible()
    expect(page.get_by_role("link", name="Generated Test Dataset:").first).to_be_visible()


def test_dataset_library_filter(page, create_test_dataset):
    page.goto(f"{FRONTEND_BASE}/library/datasets")
    expect(page.get_by_text("Dataset Library")).to_be_visible()
    page.get_by_role("textbox", name="Filter by name...").fill("generate")
    expect(page.get_by_role("link", name="Generated Test Dataset:").first).to_be_visible()
