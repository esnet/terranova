from playwright.sync_api import expect


def test_has_title(page):
    page.goto("http://localhost:5173/")
    expect(page).to_have_title("Terranova")
