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
    expect(page.locator("main").first).to_contain_text("Create Node Template")


def _mark_favorite(api_base, auth_header, datatype, item_id):
    """Helper: mark an item as favorite via the userdata API."""
    import requests as req
    headers = {"Authorization": f"Basic {auth_header}", "Content-Type": "application/json"}
    r = req.get(f"{api_base}/userdata/", headers=headers)
    userdata = r.json()
    favorites = userdata.get("favorites", {"maps": [], "datasets": [], "templates": []})
    last_edited = userdata.get("lastEdited", {"maps": [], "datasets": [], "templates": []})
    current = favorites.get(datatype, [])
    if item_id not in current:
        current.append(item_id)
    favorites[datatype] = current
    req.put(f"{api_base}/userdata/", headers=headers, json={"favorites": favorites, "lastEdited": last_edited})


def test_favorites(page, login):
    """
    Test that marking a dataset as favorite causes it to appear on the home page
    under 'My Favorites' > 'My Datasets'. Verifies FavoritesContextProvider stores
    full objects and FavLinkList renders with correct dataType-aware fields.
    """
    import base64
    ds_name = f"Fav Test Dataset: {random.randint(0, 9999)}"
    page.goto(f"{FRONTEND_BASE}/dataset/new")
    page.get_by_role("textbox", name="Name*").fill(ds_name)
    page.get_by_role("button", name="Create Dataset").click()
    expect(page.get_by_role("main")).to_contain_text(ds_name)
    dataset_id = page.url.split("/")[-1]

    auth = base64.b64encode(b"admin:admin").decode()
    _mark_favorite(API_BASE, auth, "datasets", dataset_id)

    page.evaluate("localStorage.clear()")
    page.goto(f"{FRONTEND_BASE}/")
    expect(page.get_by_role("main")).to_contain_text(ds_name, timeout=10000)


def test_favorites_template(page, login):
    """
    Test that marking a node template as favorite causes it to appear on the home page
    under 'My Favorites' > 'My Templates'.
    """
    import base64, re
    template_name = f"Fav Test Template: {random.randint(0, 9999)}"
    page.goto(f"{FRONTEND_BASE}/template/new")
    expect(page.get_by_role("main")).to_contain_text("Create Node Template")
    page.get_by_role("textbox", name="Name").fill(template_name)
    page.get_by_role("textbox", name="SVG Code").fill('<circle r="5"/>')
    page.get_by_role("button", name="Create", exact=True).click()
    expect(page).to_have_url(re.compile(r".*/template/\w{7}$"), timeout=10000)
    template_id = page.url.split("/")[-1]

    auth = base64.b64encode(b"admin:admin").decode()
    _mark_favorite(API_BASE, auth, "templates", template_id)

    page.evaluate("localStorage.clear()")
    page.goto(f"{FRONTEND_BASE}/")
    expect(page.get_by_role("main")).to_contain_text(template_name, timeout=10000)


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


def test_recent_templates(page, login):
    """
    Test that creating a node template adds it to 'Recent Node Templates' on the home page.
    Verifies that NodeTemplateEditor updates lastEdited on creation, and that
    LastEditedContextProvider correctly fetches and surfaces the full template object.
    """
    import re
    template_name = f"Home Recent Template: {random.randint(0, 9999)}"

    page.goto(f"{FRONTEND_BASE}/template/new")
    expect(page.get_by_role("main")).to_contain_text("Create Node Template")
    page.get_by_role("textbox", name="Name").fill(template_name)
    page.get_by_role("textbox", name="SVG Code").fill('<circle r="5"/>')
    page.get_by_role("button", name="Create", exact=True).click()
    expect(page).to_have_url(re.compile(r".*/template/\w{7}$"), timeout=10000)

    page.evaluate("localStorage.clear()")
    page.goto(f"{FRONTEND_BASE}/")

    main = page.get_by_role("main")
    expect(main).to_contain_text(template_name, timeout=10000)
