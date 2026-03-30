"""
Tests for the home page and sidebar of Terranova.
"""

from playwright.sync_api import expect
import random
from urls import FRONTEND_BASE, API_BASE


def test_view_libraries(page, login):
    main = page.get_by_role("main")

    main.get_by_role("link", name="Datasets").click()
    expect(main).to_contain_text("Dataset Library")
    page.get_by_role("link", name="Terranova").click()

    main.get_by_role("link", name="Maps").click()
    expect(main).to_contain_text("Map Library")
    page.get_by_role("link", name="Terranova").click()

    main.get_by_role("link", name="Node Templates").click()
    expect(main).to_contain_text("Template Library")


def test_new_buttons(page, login):
    # fails because current PktsIconButton (and probably PktsButton) fails to pass aria labels props
    page.get_by_role("button", name="Create new dataset").click()
    expect(page.locator("main").first).to_contain_text("Create New Dataset")
    page.get_by_role("link", name="Terranova").click()

    page.get_by_role("button", name="Create new map").click()
    expect(page.locator("main").first).to_contain_text("Create New Map")
    page.get_by_role("link", name="Terranova").click()

    page.get_by_role("button", name="Create new node template").click()
    expect(page.locator("main").first).to_contain_text("Node Template Builder")


def test_favorites(page, create_test_dataset):
    """
    Test that marking a dataset as favorite causes it to appear on the home page
    under 'My Favorites' > 'My Datasets'. Verifies FavoritesContextProvider stores
    full objects and FavLinkList renders with correct dataType-aware fields.
    """
    import base64
    import requests as req
    dataset_id = create_test_dataset
    # The create_test_dataset fixture navigates to the dataset editor.
    # Read the dataset name from the topbar (rendered as bold span: "Editing: {name}")
    dataset_name = page.locator(".bg-light-secondary span.font-bold").inner_text().strip()

    # Mark as favorite via API — no favorite button exists in the dataset editor UI yet.
    auth = base64.b64encode(b"admin:admin").decode()
    headers = {"Authorization": f"Basic {auth}", "Content-Type": "application/json"}
    r = req.get(f"{API_BASE}/userdata/", headers=headers)
    userdata = r.json()
    favorites = userdata.get("favorites", {})
    datasets = favorites.get("datasets", [])
    if dataset_id not in datasets:
        datasets.append(dataset_id)
    favorites["datasets"] = datasets
    req.put(f"{API_BASE}/userdata/", headers=headers, json={"favorites": favorites})

    # Clear localStorage cache and navigate home so favorites context fetches fresh data
    page.evaluate("localStorage.clear()")
    page.goto(f"{FRONTEND_BASE}/")

    # The dataset name should appear under 'My Favorites' > 'My Datasets'
    expect(page.get_by_role("main")).to_contain_text(dataset_name, timeout=10000)


def test_recent_maps(page, login):
    """
    Test that recent maps appear on the home page in the correct order (most recent first).
    Verifies LastEditedContextProvider stores full objects and sorts correctly.
    """
    map_a_name = f"Home Recent Map A: {random.randint(0, 9999)}"
    map_b_name = f"Home Recent Map B: {random.randint(0, 9999)}"

    # Create and save Map A
    page.goto(f"{FRONTEND_BASE}/map/new")
    page.get_by_role("textbox", name="Name*").fill(map_a_name)
    page.get_by_role("button", name="Create Map").click()
    expect(page.get_by_role("main")).to_contain_text(map_a_name)
    page.get_by_role("button", name="Save Changes").click()
    page.wait_for_timeout(1500)

    # Create and save Map B
    page.goto(f"{FRONTEND_BASE}/map/new")
    page.get_by_role("textbox", name="Name*").fill(map_b_name)
    page.get_by_role("button", name="Create Map").click()
    expect(page.get_by_role("main")).to_contain_text(map_b_name)
    page.get_by_role("button", name="Save Changes").click()
    page.wait_for_timeout(1500)

    # Clear localStorage cache then navigate home to force a fresh fetch from API
    page.evaluate("localStorage.clear()")
    page.goto(f"{FRONTEND_BASE}/")

    main = page.get_by_role("main")
    # Both maps should appear in "Recent Maps" section
    expect(main).to_contain_text(map_a_name, timeout=10000)
    expect(main).to_contain_text(map_b_name, timeout=10000)

    # Map B (created/saved last) should appear before Map A in the list
    map_a_pos = main.inner_text().index(map_a_name)
    map_b_pos = main.inner_text().index(map_b_name)
    assert map_b_pos < map_a_pos, "Most recently saved map should appear first"


def test_recent_datasets(page, login):
    """
    Test that recent datasets appear on the home page in the correct order (most recent first).
    Verifies LastEditedContextProvider sorts by lastUpdatedOn for datasets (not just maps).
    """
    ds_a_name = f"Home Recent Dataset A: {random.randint(0, 9999)}"
    ds_b_name = f"Home Recent Dataset B: {random.randint(0, 9999)}"

    # Create and save Dataset A
    page.goto(f"{FRONTEND_BASE}/dataset/new")
    page.get_by_role("textbox", name="Name*").fill(ds_a_name)
    page.get_by_role("button", name="Create Dataset").click()
    expect(page.get_by_role("main")).to_contain_text(ds_a_name)
    page.get_by_role("button", name="Save Changes").click()
    page.wait_for_timeout(1500)

    # Create and save Dataset B
    page.goto(f"{FRONTEND_BASE}/dataset/new")
    page.get_by_role("textbox", name="Name*").fill(ds_b_name)
    page.get_by_role("button", name="Create Dataset").click()
    expect(page.get_by_role("main")).to_contain_text(ds_b_name)
    page.get_by_role("button", name="Save Changes").click()
    page.wait_for_timeout(1500)

    # Clear localStorage cache then navigate home to force a fresh fetch from API
    page.evaluate("localStorage.clear()")
    page.goto(f"{FRONTEND_BASE}/")

    main = page.get_by_role("main")
    # Both datasets should appear in "Recent Datasets" section
    expect(main).to_contain_text(ds_a_name, timeout=10000)
    expect(main).to_contain_text(ds_b_name, timeout=10000)

    # Dataset B (created/saved last) should appear before Dataset A
    ds_a_pos = main.inner_text().index(ds_a_name)
    ds_b_pos = main.inner_text().index(ds_b_name)
    assert ds_b_pos < ds_a_pos, "Most recently saved dataset should appear first"
