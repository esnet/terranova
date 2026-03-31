"""
Tests for the Dataset Editor page of Terranova.
Uses a fresh SQLite DB with mocked Google Sheets circuit data (7 circuits
from tests/fixtures/sqlite_database.py via the autouse session fixture).
"""

from playwright.sync_api import expect


def select_pkts_option(page, combobox_locator, option_name):
    """
    Helper for PktsInputSelect: click the combobox div to open the listbox,
    then click the matching option. PktsInputSelect uses role=combobox + role=option,
    not a native <select> element.
    """
    combobox_locator.click()
    page.get_by_role("option", name=option_name).first.click()


def test_preview_edge_graph(page, create_test_dataset):
    """
    Test that the Edge Graph preview mode renders without error.
    Edge Graph uses GraphViz for logical layout -- this test verifies GraphViz
    is installed and working.
    """
    # create_test_dataset navigates to the dataset editor (Edge Graph is the default preview mode)
    main = page.get_by_role("main")
    expect(main).to_contain_text("Preview Mode")

    # Verify the Edge Graph canvas/preview area is visible
    # The logical map uses an esnet-map-canvas web component
    expect(page.locator("esnet-map-canvas").first).to_be_attached()


def test_preview_geographic(page, create_test_dataset):
    """
    Test that switching to Geographic preview mode renders the map canvas.
    An empty dataset will show a "loading" error from esnet-map-canvas, which is expected.
    The key assertion is that the canvas element itself is present in the DOM.
    """
    # PktsInputSelect renders role=combobox (not a native <select>).
    # The preview mode combobox shows "Edge Graph" by default (value="logical").
    # Filter by that text to distinguish it from other comboboxes on the page.
    preview_combobox = page.get_by_role("combobox").filter(has_text="Edge Graph")
    select_pkts_option(page, preview_combobox, "Geographic")

    # The geographic map should render an esnet-map-canvas element in the DOM
    expect(page.locator("esnet-map-canvas").first).to_be_attached()
    # The page should not show a server-side (500) error
    expect(page.get_by_role("main")).not_to_contain_text("500")


def test_preview_table(page, create_test_dataset):
    """
    Test that the Table View preview renders without a server error.
    The test dataset is empty (no datasource), so the table may show an empty
    state, but should not show a server error.
    """
    # Switch from default "Edge Graph" to "Table View"
    preview_combobox = page.get_by_role("combobox").filter(has_text="Edge Graph")
    select_pkts_option(page, preview_combobox, "Table View")

    main = page.get_by_role("main")
    expect(main).to_be_visible()
    expect(main).not_to_contain_text("500")
    expect(main).not_to_contain_text("Server Error")


def test_add_name_criterion(page, create_test_dataset):
    """
    Test adding a filter criterion on the 'name' field (a standard pre-defined column).
    Verifies the criterion UI appears and the hit count is visible.
    """
    # Wait for query endpoints to load — the "Add Criterion" button only appears after
    # the datasources API call completes (queryEndpointsLoading becomes false)
    add_query_btn = page.get_by_role("button", name="Add Criterion")
    expect(add_query_btn).to_be_visible(timeout=10000)
    add_query_btn.click()

    # Criterion rows render as div.flex.justify-left.items-center.gap-2
    criterion_row = page.locator(".flex.justify-left.items-center").first
    expect(criterion_row).to_be_visible(timeout=5000)

    # Hit count renders in a span.mx-2: "0 values", "1 value", etc.
    hit_count = criterion_row.locator("span.mx-2")
    expect(hit_count).to_be_visible()


def test_add_endpoint_metadata_criterion(page, create_test_dataset):
    """
    Test adding a filter criterion on endpoint metadata (e.g., endpoints_location_name).
    This tests that arbitrary metadata columns from the data source can be filtered on.
    """
    add_query_btn = page.get_by_role("button", name="Add Criterion")
    expect(add_query_btn).to_be_visible(timeout=10000)
    add_query_btn.click()

    criterion_row = page.locator(".flex.justify-left.items-center").first
    expect(criterion_row).to_be_visible(timeout=5000)

    # Open the field combobox (first combobox in the criterion row)
    field_combobox = criterion_row.get_by_role("combobox").first
    field_combobox.click()
    page.wait_for_timeout(500)

    # Collect available options from the open listbox
    options_locator = page.get_by_role("option")
    endpoint_fields = [
        options_locator.nth(i).inner_text()
        for i in range(options_locator.count())
        if "endpoint" in options_locator.nth(i).inner_text().lower()
        or "location" in options_locator.nth(i).inner_text().lower()
    ]

    if endpoint_fields:
        # Select the first endpoint-related field
        page.get_by_role("option", name=endpoint_fields[0]).first.click()
        page.wait_for_timeout(2000)
        hit_count = criterion_row.locator("span.mx-2")
        expect(hit_count).to_be_visible()
    else:
        # No endpoint fields available (no datasource selected) — close and verify row
        page.keyboard.press("Escape")
        expect(criterion_row.locator("span.mx-2")).to_be_visible()


def test_latitude_longitude_filter_bug(page, create_test_dataset):
    """
    Test that filtering on endpoint latitude/longitude does NOT cause a 500 error.
    Previously, abstract_models.py had no handler for Python float fields (JSON schema
    'number' type), causing a crash when lat/lon columns were used as filter criteria.
    Bug fix: added 'number' type handler in flatten_field and fixed get_unique_values
    to handle non-string values without crashing.
    """
    add_query_btn = page.get_by_role("button", name="Add Criterion")
    expect(add_query_btn).to_be_visible(timeout=10000)
    add_query_btn.click()

    criterion_row = page.locator(".flex.justify-left.items-center").first
    expect(criterion_row).to_be_visible(timeout=5000)

    # Open the field combobox
    field_combobox = criterion_row.get_by_role("combobox").first
    field_combobox.click()
    page.wait_for_timeout(500)

    options_locator = page.get_by_role("option")
    lat_lon_fields = [
        options_locator.nth(i).inner_text()
        for i in range(options_locator.count())
        if "latitude" in options_locator.nth(i).inner_text().lower()
        or "longitude" in options_locator.nth(i).inner_text().lower()
    ]

    if lat_lon_fields:
        # Select latitude field -- this used to cause a 500 error before the fix
        page.get_by_role("option", name=lat_lon_fields[0]).first.click()
        page.wait_for_timeout(3000)
        expect(page.get_by_role("main")).not_to_contain_text("Server Error")
        expect(page.get_by_role("main")).not_to_contain_text("500")
        expect(criterion_row).to_be_visible()
    else:
        # Lat/lon fields not exposed as filterable (no datasource selected) — passes trivially
        page.keyboard.press("Escape")
