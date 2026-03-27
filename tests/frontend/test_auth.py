"""
Tests all auth related frontend features
"""

from playwright.sync_api import expect
import pytest
import random
from tests.frontend.conftest import AUTH_BACKEND
from urls import FRONTEND_BASE


@pytest.mark.skipif(AUTH_BACKEND != "basic", reason="requires basic auth")
def test_basic_auth_login(page):
    """This is the same code that is found in frontend/conftest.py, but also includes assertions"""
    page.goto(f"{FRONTEND_BASE}/")
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


@pytest.mark.skipif(AUTH_BACKEND != "basic", reason="requires basic auth")
def test_create_user_permissions(page, login_as_write_user):
    """
    Tests that a user with only read+write scopes (no publish, no admin) sees a
    properly restricted UI: no Settings link, no Publish button in the map editor,
    and no Node SVG Builder / Node Templates in the sidebar.
    """
    sidebar = page.locator("#sidebar")

    # No Settings link in sidebar (requires publish scope)
    expect(sidebar.get_by_role("link", name="Settings")).not_to_be_visible()

    # No Node SVG Builder in sidebar (requires admin scope after fix)
    expect(sidebar.get_by_role("link", name="Node SVG Builder")).not_to_be_visible()

    # No Node Templates section in sidebar Libraries (requires admin scope)
    expect(sidebar.get_by_role("link", name="Node Templates")).not_to_be_visible()

    # Create a map to open the map editor (write scope allows this)
    map_name = f"Permission Test Map: {random.randint(0, 1000)}"
    page.goto(f"{FRONTEND_BASE}/map/new")
    page.get_by_role("textbox", name="Name*").fill(map_name)
    page.get_by_role("button", name="Create Map").click()
    expect(page.get_by_role("main")).to_contain_text(map_name)

    # No Publish Map button in map editor (requires publish scope)
    expect(page.get_by_role("button", name="Publish Map")).not_to_be_visible()


@pytest.mark.skipif(AUTH_BACKEND != "basic", reason="requires basic auth")
def test_no_interstitial_login_page(page, login):
    """
    After login (which persists credentials in session storage), navigating to the
    root URL should NOT show a flash of the login page. The fix in ProtectedRoute
    returns null while auth.isLoading is true, preventing the flash.
    """
    # Login sets session storage credentials (AUTH_SESSION_STORAGE=true in test settings)
    # Navigate away and back to trigger the async session restore
    page.goto(f"{FRONTEND_BASE}/login")
    page.goto(f"{FRONTEND_BASE}/")

    # The login heading should NOT be visible -- even immediately after navigation,
    # the component should render null (not the login page) while auth is loading.
    expect(page.get_by_role("heading", name="Login")).not_to_be_visible()

    # The app should load normally after auth resolves
    expect(page.get_by_role("link", name="Terranova")).to_be_visible()
