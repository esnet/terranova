"""
Tests for the home page of Terranova.
"""

from playwright.sync_api import expect


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
    # ensure new button leads to some create new item menu
    page.get_by_role("button").nth(1).click()
    expect(page.locator("form")).to_contain_text("Create New Dataset")
    page.get_by_role("link", name="Terranova").click()

    page.get_by_role("button").nth(2).click()
    expect(page.locator("form")).to_contain_text("Create New Map")
    page.get_by_role("link", name="Terranova").click()

    page.get_by_role("button").nth(3).click()
    expect(page.locator("form")).to_contain_text("Node Template Builder")
