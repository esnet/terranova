"""
Tests for anything map related in Terranova, including map creation, map editing, and map publishing/output.
"""

from playwright.sync_api import expect
import pytest
import re
import time
import random


def test_create_map(page, login):
    # unreliable way of clicking on the create map icon button
    page.get_by_role("button").nth(2).click()

    # perhaps it may be better to have a proper named button instead of an icon button
    expect(page.get_by_role("button", name="Create New Map")).to_be_visible()

    page.get_by_role("textbox", name="Name*").click()
    page.get_by_role("textbox", name="Name*").fill("Create Map Test")
    page.get_by_role("button", name="Create Map").click()

    expect(page.get_by_role("main")).to_contain_text("Create Map Test")
    # map id expected to be of length 7
    expect(page).to_have_url(re.compile(r".*/map/\w{7}$"))


def test_create_forked_map(page, login):
    page.get_by_role("main").get_by_role("link", name="Maps").click()
    # will need to be changed
    page.get_by_role("button", name="Create New").click()
    expect(page.get_by_role("heading", name="Terranova")).to_be_visible()

    # fill out name
    page.get_by_role("textbox", name="Name*").click()
    page.get_by_role("textbox", name="Name*").fill("Fork Map Test")
    # check the fork option
    page.get_by_role("checkbox", name="Fork Existing Map").check()

    # select the "Create Map Test" map to fork from
    page.get_by_role("textbox", name="Map Name*").click()
    expect(page.get_by_role("listbox", name="Typeahead Dropdown Options")).to_be_visible()
    page.get_by_role("option", name="Create Map Test").first.press("Enter")
    expect(page.locator("form")).to_contain_text("Create Map Test")

    # select "v1" version to fork from
    page.get_by_role("textbox", name="Version*").click()
    expect(page.get_by_role("listbox", name="Typeahead Dropdown Options")).to_be_visible()
    page.get_by_role("option", name="v1").first.click()
    expect(page.locator("form")).to_contain_text("v1")

    # click create
    page.get_by_role("button", name="Create Map", exact=True).click()

    expect(page.get_by_role("main")).to_contain_text("Fork Map Test")
    expect(page).to_have_url(re.compile(r".*/map/\w{7}$"))


# THE FOLLOWING TESTS MUST BE RAN SEQUENTIALLY
MAP_NAME = f"Map Editor Test: {random.randint(0, 1000)}"


def test_map_change_cancel(page, login):
    # Create new map
    page.locator("#sidebar").get_by_role("link", name="Maps").click()
    page.get_by_role("button", name="Create New").click()
    expect(page.get_by_role("heading", name="Terranova")).to_be_visible()
    # Fill out new map creation form
    page.get_by_role("textbox", name="Name*").click()
    page.get_by_role("textbox", name="Name*").fill(MAP_NAME)
    page.get_by_role("button", name="Create Map").click()
    expect(page.get_by_role("group", name="Node Style")).to_be_visible()

    # Modify something random
    page.get_by_role("combobox").filter(has_text="Map Tiles").click()
    expect(page.get_by_role("listbox", name="Input Select Options")).to_be_visible()
    page.get_by_role("option", name="Solid Color").click()
    expect(page.get_by_role("main")).to_contain_text("Current Version: 1")
    page.get_by_role("button", name="Discard Changes").click()
    expect(page.get_by_role("main")).to_contain_text("Current Version: 1")
    # Ensure persistence
    time.sleep(1)
    page.reload()
    expect(page.get_by_role("main")).to_contain_text("Current Version: 1")


# def test_rename_map(page, login):
#     pass # TODO:


def test_change_map_center_manually(page, login):
    # Navigate to map
    page.get_by_role("link", name=MAP_NAME).click()
    # Modify map center and zoom
    page.get_by_role("spinbutton", name="Starting Latitude").fill("40")
    page.get_by_role("spinbutton", name="Starting Longitude").fill("-100")
    page.get_by_role("slider", name="Start Zoom").fill("5.5")
    page.get_by_role("button", name="Save Changes").click()
    # ensure persist on reload
    time.sleep(0.5)
    page.reload()
    time.sleep(0.5)
    expect(page.get_by_role("slider", name="Start Zoom")).to_have_value("5.5")
    expect(page.get_by_role("spinbutton", name="Starting Latitude")).to_have_value("40")
    expect(page.get_by_role("spinbutton", name="Starting Longitude")).to_have_value("-100")


def test_change_map_center_via_map_view(page, login):
    # Navigate to map
    page.get_by_role("link", name=MAP_NAME).click()
    # Modify map center via map view on left (shrink by .125 12 times to get 5.5 - (12*0.125) = 4)
    for i in range(12):
        page.get_by_test_id("06b943").click()
    page.get_by_role("button", name="Set Center & Zoom From Map").click()
    expect(page.get_by_role("slider", name="Start Zoom")).to_have_value("4")
    page.get_by_role("button", name="Save Changes").click()
    # ensure persist on reload
    time.sleep(0.5)
    page.reload()
    time.sleep(0.5)
    expect(page.get_by_role("slider", name="Start Zoom")).to_have_value("4")


def test_publish_map(page, login):
    # Navigate to map
    page.get_by_role("link", name=MAP_NAME).click()
    # Publish map
    page.get_by_role("button", name="Publish Map").click()
    dialog = page.get_by_role("dialog")
    expect(dialog).to_contain_text("Publish Map Confirmation")
    expect(dialog.get_by_role("button", name="Cancel")).to_be_visible()
    dialog.get_by_role("button", name="Publish", exact=True).click()

    expect(dialog).to_contain_text("Map Published")


def test_output_map_url(page, login, context):
    context.grant_permissions(["clipboard-write", "clipboard-read"])
    # Navigate to map
    page.get_by_role("link", name=MAP_NAME).click()
    # View default (Grafana) output, a link
    page.get_by_role("button", name="Get Map Output").click()
    dialog = page.get_by_role("dialog")
    expect(dialog).to_contain_text("Map Output")
    dialog.get_by_role("button", name="Copy to Clipboard").click()
    clipboard_text = page.evaluate("navigator.clipboard.readText()")

    pattern = re.compile(r"https?://localhost:\d+/public/output/map/\S+")
    expect(dialog.get_by_text("public/output")).to_contain_text(pattern)

    assert re.search(
        pattern, clipboard_text
    ), f"Map output copied to clipboard: '{clipboard_text}' failed to match."


def test_output_map_svg(page, login, context):
    context.grant_permissions(["clipboard-write", "clipboard-read"])
    # Navigate to map
    page.get_by_role("link", name=MAP_NAME).click()
    # View Raw SVG Output
    page.get_by_role("button", name="Get Map Output").click()
    dialog = page.get_by_role("dialog")
    dialog.get_by_role("combobox").filter(has_text="Grafana").click()
    dialog.get_by_role("option", name="Raw SVG Output").click()
    dialog.get_by_role("button", name="Copy to Clipboard").click()
    # TODO: check what is even in clipboard

    with page.expect_download() as download_info:
        dialog.get_by_role("link", name="Download").click()
        download = download_info.value  # TODO: check download value
    expect(dialog).not_to_contain_text(
        "Error fetching SVG output. Check to see if your map is published."
    )
    # TODO: fix this test: API failing to generate SVG
    # Error is:
    #   |   File "/home/echennau/LBNL/terranova/terranova/output/svg.py", line 81, in render_map_svg
    #   |     layers = [json.loads(layer["mapjson"]) for layer in configuration["layers"]]
    #   |               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    #   | orjson.JSONDecodeError: Input must be bytes, bytearray, memoryview, or str: line 1 column 1 (char 0)
    pytest.fail("See test_output_map_svg for more info.")


# TODO: add tests involving modifying map layers
# TODO: implement COPY TO CLIPBOARD FUNCTIONALITY
