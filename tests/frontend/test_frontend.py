from playwright.sync_api import expect


def test_has_title(page):
    page.goto("http://localhost:5173/")
    expect(page).to_have_title("Terranova")


def test_navbar(page, login):
    page.get_by_role("img", name="avatar").hover()
    settings_link = page.get_by_role("navigation").get_by_role("link", name="Settings").first
    expect(settings_link).to_be_visible()
    expect(settings_link).to_have_attribute("href", "/settings")

    home_link = page.get_by_role("link", name="Terranova")
    expect(home_link).to_be_visible()
    expect(home_link).to_have_attribute("href", "/")

    page.get_by_role("img", name="avatar").click()
    page.get_by_role("link", name="Sign out").press("Enter")
    expect(page.get_by_text("You have been logged out")).to_be_visible()


def test_sidebar(page, login):
    # some basic expectations of what should always be on sidebar
    expect(page.get_by_text("Tools")).to_be_visible()
    expect(page.get_by_text("Libraries")).to_be_visible()
    expect(page.get_by_text("Resources")).to_be_visible()


def test_sidebar_toggle(page, login):
    expect(page.get_by_text("Tools")).to_be_visible()
    page.get_by_role("button", name="Close Sidebar").click()
    expect(page.get_by_text("Tools")).not_to_be_visible()
    page.get_by_role("button", name="Open Sidebar").click()
    expect(page.get_by_text("Tools")).to_be_visible()
