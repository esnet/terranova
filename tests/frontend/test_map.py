"""
Tests for anything map related in Terranova.
"""

from playwright.sync_api import expect
import re


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
