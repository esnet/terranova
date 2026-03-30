"""
Tests for sidebar navigation within the SPA.

These tests specifically cover navigation between pages of the same type
(e.g. map editor -> map editor, dataset editor -> dataset editor), which is a
known failure mode: React Router updates the URL and params, but components
that initialize data controllers via useState with an empty useEffect
dependency array will not re-fetch for the new route — leaving the page
showing stale data from the previous item.

NOTE: These tests must navigate exclusively via sidebar links rather than
page.goto(), because page.goto() triggers a full page reload which resets
React context (including lastEdited), causing the sidebar to depopulate.
"""

from playwright.sync_api import expect
import pytest
import random
from urls import FRONTEND_BASE



@pytest.fixture
def two_test_maps(page, login):
    """
    Creates two maps via the UI and returns their (id, name) tuples.
    Leaves the browser on the second map's editor page, with both maps
    present in the sidebar's recently edited list.

    After creating each map, the app calls refreshGlobalLastEdited() and
    updates userdata.lastEdited — both of which are async. We wait for
    both maps to appear in the sidebar before returning so that tests
    depending on this fixture see a stable sidebar state.
    """
    maps = []
    sidebar = page.locator("#sidebar")
    for i in range(2):
        name = f"Nav Test Map {i + 1}: {random.randint(0, 9999)}"
        page.goto(f"{FRONTEND_BASE}/map/new")
        page.get_by_role("textbox", name="Name*").fill(name)
        page.get_by_role("button", name="Create Map").click()
        expect(page.get_by_role("main")).to_contain_text(name)
        map_id = page.url.split("/")[-1]
        maps.append((map_id, name))
        # Wait for this map to appear in the sidebar before creating the next one.
        # This ensures the GlobalLastEdited refresh has completed for each map.
        expect(sidebar).to_contain_text(name, timeout=15000)
    return maps


def test_sidebar_shows_recently_created_maps(page, two_test_maps):
    """
    Both maps should appear in the sidebar's Libraries > Maps section
    after being created in the same session.
    """
    _, map_a_name = two_test_maps[0]
    _, map_b_name = two_test_maps[1]

    sidebar = page.locator("#sidebar")
    expect(sidebar).to_contain_text(map_a_name)
    expect(sidebar).to_contain_text(map_b_name)


def test_sidebar_navigation_between_map_editors(page, two_test_maps):
    """
    Clicking a sidebar link to a different map while in the map editor
    should update both the URL and the displayed map name in the topbar.

    Failure here indicates that the MapEditorPageComponent is not responding
    to mapId param changes — the URL updates via React Router but the
    component's data controllers are stale (initialized via useState with
    an empty useEffect dependency array and never re-run for new params).
    """
    map_a_id, map_a_name = two_test_maps[0]
    map_b_id, map_b_name = two_test_maps[1]

    # The map name appears in a <span> adjacent to <b>Editing: </b> in the topbar.
    topbar_name = page.locator("b:has-text('Editing:') + span")

    # Fixture leaves us on map B. Navigate to map A via the sidebar.
    page.locator("#sidebar").get_by_role("link", name=map_a_name).click()
    expect(page).to_have_url(f"{FRONTEND_BASE}/map/{map_a_id}")
    expect(topbar_name).to_have_text(map_a_name)

    # Now navigate back to map B via the sidebar.
    page.locator("#sidebar").get_by_role("link", name=map_b_name).click()
    expect(page).to_have_url(f"{FRONTEND_BASE}/map/{map_b_id}")
    expect(topbar_name).to_have_text(map_b_name)


# ---------------------------------------------------------------------------
# Dataset tests — same two bugs as maps, applied to the dataset editor
# ---------------------------------------------------------------------------

@pytest.fixture
def two_test_datasets(page, login):
    """
    Creates two datasets via the UI and returns their (id, name) tuples.
    Leaves the browser on the second dataset's editor page, with both
    datasets present in the sidebar's recently edited list.
    """
    datasets = []
    sidebar = page.locator("#sidebar")
    for i in range(2):
        name = f"Nav Test Dataset {i + 1}: {random.randint(0, 9999)}"
        page.goto(f"{FRONTEND_BASE}/dataset/new")
        page.get_by_role("textbox", name="Name*").fill(name)
        page.get_by_role("button", name="Create Dataset").click()
        expect(page.get_by_role("main")).to_contain_text(name)
        dataset_id = page.url.split("/")[-1]
        datasets.append((dataset_id, name))
        # Wait for this dataset to appear in the sidebar before creating the next one.
        expect(sidebar).to_contain_text(name, timeout=15000)
    return datasets


def test_sidebar_shows_recently_created_datasets(page, two_test_datasets):
    """
    Both datasets should appear in the sidebar's Libraries > Datasets section
    after being created in the same session.
    """
    _, dataset_a_name = two_test_datasets[0]
    _, dataset_b_name = two_test_datasets[1]

    sidebar = page.locator("#sidebar")
    expect(sidebar).to_contain_text(dataset_a_name)
    expect(sidebar).to_contain_text(dataset_b_name)


def test_sidebar_navigation_between_dataset_editors(page, two_test_datasets):
    """
    Clicking a sidebar link to a different dataset while in the dataset editor
    should update both the URL and the displayed dataset name.

    Failure here indicates that DatasetEditorPageComponent is not responding
    to datasetId param changes — same stale useState/useEffect pattern as the
    map editor bug.
    """
    dataset_a_id, dataset_a_name = two_test_datasets[0]
    dataset_b_id, dataset_b_name = two_test_datasets[1]

    # Dataset name is in the topbar: <b>Editing: </b><span>name</span>
    display_name = page.locator("b:has-text('Editing:') + span")

    # Fixture leaves us on dataset B. Navigate to dataset A via the sidebar.
    page.locator("#sidebar").get_by_role("link", name=dataset_a_name).click()
    expect(page).to_have_url(f"{FRONTEND_BASE}/dataset/{dataset_a_id}")
    expect(display_name).to_have_text(dataset_a_name)

    # Now navigate back to dataset B via the sidebar.
    page.locator("#sidebar").get_by_role("link", name=dataset_b_name).click()
    expect(page).to_have_url(f"{FRONTEND_BASE}/dataset/{dataset_b_id}")
    expect(display_name).to_have_text(dataset_b_name)
