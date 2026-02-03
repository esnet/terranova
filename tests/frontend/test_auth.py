"""
Tests all auth related frontend features
"""

from playwright.sync_api import expect
import pytest
from tests.frontend.conftest import AUTH_BACKEND


@pytest.mark.skipif(AUTH_BACKEND != "basic", reason="requires basic auth")
def test_basic_auth_login(page):
    """This is the same code that is found in frontend/conftest.py, but also includes assertions"""
    page.goto("http://localhost:5173/")
    expect(page.get_by_role("heading", name="Login", level=2)).to_have_text("Login")
    page.locator('input[name="username"]').click()
    page.locator('input[name="username"]').fill("admin")
    page.locator('input[name="username"]').press("Tab")
    page.locator('input[name="password"]').fill("admin")
    page.locator('input[name="password"]').press("Enter")
    page.locator('button[type="submit"]').click()
    expect(page.get_by_role("link", name="Terranova")).to_be_visible()


@pytest.mark.skipif(AUTH_BACKEND != "keycloak", reason="requires basic auth")
def test_keycloak_login(page): ...  # TODO


def test_signout(page, login):
    # click on the navbar avatar to sign out
    # page.locator("nav > *").nth(-1).dispatch_event("click")
    page.get_by_role("img", name="avatar").click()
    page.get_by_role("link", name="Sign out").click()
    expect(page.locator("#root")).to_contain_text("You have been logged out")
