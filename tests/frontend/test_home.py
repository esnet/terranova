"""
Tests for the home page and sidebar of Terranova.
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
    # fails because current PktsIconButton (and probably PktsButton) fails to pass aria labels props
    page.get_by_role("button", name="Create new dataset").click()
    expect(page.locator("main").first).to_contain_text("Create New Dataset")
    page.get_by_role("link", name="Terranova").click()

    page.get_by_role("button", name="Create new map").click()
    expect(page.locator("main").first).to_contain_text("Create New Map")
    page.get_by_role("link", name="Terranova").click()

    page.get_by_role("button", name="Create new node template").click()
    expect(page.locator("main").first).to_contain_text("Node Template Builder")
