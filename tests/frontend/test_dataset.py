"""
Tests for anything dataset related in Terranova.
"""

from playwright.sync_api import expect
import re


def test_create_dataset(page, login):
    # unreliable way of clicking on the create dataset icon button
    page.get_by_role("button").nth(1).click()

    page.get_by_role("textbox", name="Name*").click()
    page.get_by_role("textbox", name="Name*").fill("Create Dataset Test")
    page.get_by_role("button", name="Create Dataset").click()

    expect(page.get_by_role("main")).to_contain_text("Create Dataset Test")
    expect(page).to_have_url(re.compile(r".*/dataset/\w{7}$"))


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


def test_dataset_discard_Changes(page, create_test_dataset):
    expect(page.get_by_label("Preview Mode")).to_have_value("logical")
    # change arbitrary value
    page.get_by_label("Preview Mode").select_option("geographic")
    expect(page.get_by_label("Preview Mode")).to_have_value("geographic")
    page.get_by_role("button", name="Discard Changes").click()
    expect(page.get_by_label("Preview Mode")).to_have_value("logical")


def test_dataset_discard_Changes(page, create_test_dataset):
    expect(page.locator("#dataset-editor-sidebar")).to_contain_text("Current Version 1")
    page.get_by_label("Preview Mode").select_option("geographic")
    page.get_by_role("button", name="Save Changes").click()
    # ensure persistence
    page.reload()
    expect(page.get_by_label("Preview Mode")).to_have_value("logical")
    expect(page.locator("#dataset-editor-sidebar")).to_contain_text("Current Version 2")
