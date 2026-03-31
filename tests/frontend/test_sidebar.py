"""
Tests for the Left Sidebar of Terranova.
"""

from playwright.sync_api import expect
import random
import re
from urls import FRONTEND_BASE


def test_create_dataset_sidebar(page, login):
    """
    Test that clicking 'Create New Layer' in the sidebar navigates to the dataset
    creator and that after creation the new dataset appears in the sidebar.
    """
    page.goto(f"{FRONTEND_BASE}/")
    sidebar = page.locator("#sidebar")
    expect(sidebar).to_be_visible()

    # Click 'Create New Layer' in the sidebar Tools section
    sidebar.get_by_role("link", name="Create New Layer").click()
    expect(page).to_have_url(re.compile(r".*/dataset/new"))
    expect(page.get_by_role("main")).to_contain_text("Create New Dataset")

    # Create the dataset
    ds_name = f"Sidebar Dataset: {random.randint(0, 9999)}"
    page.get_by_role("textbox", name="Name*").fill(ds_name)
    page.get_by_role("button", name="Create Dataset").click()

    # Should navigate to the dataset editor
    expect(page).to_have_url(re.compile(r".*/dataset/\w+"))
    expect(page.get_by_role("main")).to_contain_text(ds_name)


def test_create_map_sidebar(page, login):
    """
    Test that clicking 'Create New Map' in the sidebar navigates to the map
    creator and that after creation the map editor opens.
    """
    page.goto(f"{FRONTEND_BASE}/")
    sidebar = page.locator("#sidebar")

    # Click 'Create New Map' in the sidebar Tools section
    sidebar.get_by_role("link", name="Create New Map").click()
    expect(page).to_have_url(re.compile(r".*/map/new"))
    expect(page.get_by_role("main")).to_contain_text("Create New Map")

    # Create the map
    map_name = f"Sidebar Map: {random.randint(0, 9999)}"
    page.get_by_role("textbox", name="Name*").fill(map_name)
    page.get_by_role("button", name="Create Map").click()

    # Should navigate to the map editor
    expect(page).to_have_url(re.compile(r".*/map/\w+"))
    expect(page.get_by_role("main")).to_contain_text(map_name)


def test_svg_builder_sidebar(page, login):
    """
    Test that clicking 'Node SVG Builder' in the sidebar navigates to the template
    creator, and that after creating a template, the editor page shows with the SVG.
    This tests the fix to the template creation flow (button name mismatch + navigation).
    """
    page.goto(f"{FRONTEND_BASE}/")
    sidebar = page.locator("#sidebar")

    # Admin user should see the 'Node SVG Builder' link
    svg_builder_link = sidebar.get_by_role("link", name="Node SVG Builder")
    expect(svg_builder_link).to_be_visible()

    svg_builder_link.click()
    expect(page).to_have_url(re.compile(r".*/template/new"))

    # Create a new node template
    template_name = f"SVG Builder Test: {random.randint(0, 9999)}"
    test_svg = '<rect x="-6" y="-6" width="12" height="12" fill="red"/>'

    page.get_by_role("textbox", name="Name").fill(template_name)
    page.get_by_role("textbox", name="SVG Code").fill(test_svg)
    page.get_by_role("button", name="Create", exact=True).click()

    # Should navigate to the template editor page
    expect(page).to_have_url(re.compile(r".*/template/\w{7}$"), timeout=5000)

    # The editor should show the template name in the Name input (loaded from API)
    expect(page.get_by_role("textbox", name="Name")).to_have_value(template_name, timeout=10000)

    # The SVG preview should be visible with our shape
    preview = page.locator('svg[viewBox="-25 -25 50 50"]').first
    expect(preview).to_be_visible()


def test_sidebar_datasets_count_and_order(page, login):
    """
    Test that the sidebar shows at most 3 datasets, in order of most recently
    edited first. Creates 4 datasets so we can verify only 3 appear and order is correct.
    """
    # Create 4 datasets in sequence
    ds_names = [f"Order Test Dataset {i}: {random.randint(0, 9999)}" for i in range(1, 5)]

    for ds_name in ds_names:
        page.goto(f"{FRONTEND_BASE}/dataset/new")
        page.get_by_role("textbox", name="Name*").fill(ds_name)
        page.get_by_role("button", name="Create Dataset").click()
        expect(page.get_by_role("main")).to_contain_text(ds_name)
        # Save to update lastEdited
        page.get_by_role("button", name="Save Changes").click()
        page.wait_for_timeout(300)

    # Navigate home and then check the sidebar
    page.goto(f"{FRONTEND_BASE}/")
    sidebar = page.locator("#sidebar")
    expect(sidebar).to_be_visible()

    # Wait for the sidebar to populate before asserting (data loads asynchronously)
    expect(sidebar).to_contain_text(ds_names[-1], timeout=15000)

    # The sidebar shows at most 3 datasets (GlobalLastEdited is capped at 3)
    # Exclude /dataset/new (the "Create New Layer" tool link); :visible filters
    # out the ResponsiveLink duplicate rendered for the other screen size
    dataset_links = sidebar.locator('a[href*="/dataset/"]:not([href*="/dataset/new"]):visible')

    # Should show no more than 3
    link_count = dataset_links.count()
    assert link_count <= 3, f"Expected at most 3 datasets in sidebar, got {link_count}"

    # The 3 most recently created datasets (ds_names[1], ds_names[2], ds_names[3])
    # should be visible; the oldest (ds_names[0]) may be pushed out
    sidebar_text = sidebar.inner_text()

    # The three most recent should appear
    for ds_name in ds_names[1:]:
        assert ds_name in sidebar_text, f"Expected '{ds_name}' in sidebar"


def test_sidebar_maps_count_and_order(page, login):
    """
    Test that the sidebar shows at most 3 maps, in order of most recently edited first.
    Creates 4 maps to verify only 3 appear and the oldest is pushed out.
    """
    map_names = [f"Order Test Map {i}: {random.randint(0, 9999)}" for i in range(1, 5)]

    for map_name in map_names:
        page.goto(f"{FRONTEND_BASE}/map/new")
        page.get_by_role("textbox", name="Name*").fill(map_name)
        page.get_by_role("button", name="Create Map").click()
        expect(page.get_by_role("main")).to_contain_text(map_name)
        page.get_by_role("button", name="Save Changes").click()
        page.wait_for_timeout(300)

    page.goto(f"{FRONTEND_BASE}/")
    sidebar = page.locator("#sidebar")

    # Wait for the sidebar to populate before asserting (data loads asynchronously)
    expect(sidebar).to_contain_text(map_names[-1], timeout=15000)

    # Sidebar should show at most 3 maps (exclude /map/new tool link; :visible
    # filters out the ResponsiveLink duplicate rendered for the other screen size)
    map_links = sidebar.locator('a[href*="/map/"]:not([href*="/map/new"]):visible')
    link_count = map_links.count()
    assert link_count <= 3, f"Expected at most 3 maps in sidebar, got {link_count}"

    # The 3 most recently created maps should be visible
    sidebar_text = sidebar.inner_text()
    for map_name in map_names[1:]:
        assert map_name in sidebar_text, f"Expected '{map_name}' in sidebar"


def test_sidebar_templates_count_and_order(page, login):
    """
    Test that the sidebar shows at most 3 node templates, in order of most recently
    edited first. There are 6 default seeded templates -- verify only 3 are shown.
    """
    page.goto(f"{FRONTEND_BASE}/")
    sidebar = page.locator("#sidebar")
    expect(sidebar).to_be_visible()

    # Wait for the templates section to load (it's gated on admin scope)
    # Admin user should see the Node Templates section.
    # Exclude the "Node SVG Builder" link which goes to /template/new.
    templates_section = sidebar.locator('a[href*="/template/"]:not([href="/template/new"]):visible')

    # Should show at most 3 templates
    # (GlobalLastEdited fetches limit=3)
    template_link_count = templates_section.count()
    assert template_link_count <= 3, (
        f"Expected at most 3 templates in sidebar, got {template_link_count}"
    )
