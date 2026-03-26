from playwright.sync_api import expect
import pytest
import os
import shutil
import subprocess
import time
import random
import re


# AUTH_BACKEND can be basic or keycloak, in which different tests would apply
# this should be read dynamically from ./mock/settings.yml, but this will suffice
# as there are no tests intended for the keycloak version yet.
# TODO: update login fixture and write auth tests for keycloak
AUTH_BACKEND = "basic"


@pytest.fixture(autouse=True)
def setup_server_processes(request):
    """
    Spawn a frontend and backend process to be used in tests.
    It would be helpful it pytest-playwright supported this like the JS version ndoes (webServer)...
    """
    # set "fact" about the parent of _this script_
    parent_dir = os.path.dirname(__file__)
    # path to top level dir. ugh.
    app_root = os.path.join(parent_dir, os.pardir, os.pardir)
    # path to python .venv
    venv_python_path = os.path.join(app_root, ".venv", "bin", "python")
    # path to doc root for pre-compiled frontend files
    frontend_docroot = os.path.join(app_root, "terranova", "frontend", "dist-test")
    # path to the config file for the API for these tests
    test_config_path = os.path.join(parent_dir, "mock", "settings.yml")
    # path to the JS settings file for these tests
    js_settings_source_path = os.path.join(parent_dir, "mock", "settings.js")
    # path to the copy target for the JS settings file
    js_settings_target_path = os.path.join(frontend_docroot, "static", "settings.js")

    # overwrite the ephemeral JS settings file
    shutil.copyfile(js_settings_source_path, js_settings_target_path)

    frontend_server = "%s/utils/frontend_server.py" % parent_dir
    # spawn a simple http server from the frontend docroot, serving the pre-compiled frontend files
    js_proc = subprocess.Popen(
        [venv_python_path, frontend_server], cwd=frontend_docroot, universal_newlines=True
    )

    # create an environment for the API server
    api_env = os.environ.copy()
    api_env["TERRANOVA_CONF"] = test_config_path
    api_env["MOCKS"] = "tests.frontend.mock.mocks"
    api_proc = subprocess.Popen(
        [venv_python_path, "-m", "uvicorn", "terranova.api:app"], env=api_env, cwd=app_root
    )

    time.sleep(2)

    def teardown_processes():
        js_proc.kill()
        api_proc.kill()

    request.addfinalizer(teardown_processes)

    return True


@pytest.fixture
def login(setup_server_processes, page):
    """Fixture that automatically logs in when included in a test. Does not return anything."""
    if AUTH_BACKEND == "basic":
        page.goto("http://localhost:5173/")
        page.locator('input[name="username"]').fill("admin")
        page.locator('input[name="password"]').fill("admin")
        page.get_by_role("button", name="Login").click()
        expect(page.locator("#root")).to_contain_text("Terranova")
    else:
        raise Exception("Testing Unsupported Auth Backend: " + AUTH_BACKEND)


@pytest.fixture
def create_test_map(page, login):
    """
    Fixture that sets up an independent map to be used for testing. Automatically runs login fixture.
    Automatically navigates to the map editor for the created map,
    but can be navigated to as such: `page.goto("http://localhost:5173/map/" + create_test_map)`.
    Returns the map ID."""
    map_name = f"Generated Test Map: {random.randint(0, 1000)}"
    # Create new map
    page.goto("http://localhost:5173/map/new")
    # Fill out new map creation form
    page.get_by_role("textbox", name="Name*").click()
    page.get_by_role("textbox", name="Name*").fill(map_name)
    page.get_by_role("button", name="Create Map").click()
    expect(page).to_have_url(re.compile(r".*/map/.*"))
    expect(page.get_by_role("main")).to_contain_text(map_name)

    return page.url.split("/")[-1]


@pytest.fixture
def create_test_dataset(page, login):
    """
    Fixture that sets up an independent dataset to be used for testing. Automatically runs login fixture.
    Automatically navigates to the dataset editor for the created dataset,
    but can be navigated to as such: `page.goto("http://localhost:5173/dataset/" + create_test_dataset)`.
    Returns the dataset ID."""
    dataset_name = f"Generated Test Dataset: {random.randint(0, 1000)}"
    # Create new map
    page.goto("http://localhost:5173/dataset/new")
    # Fill out new map creation form
    page.get_by_role("textbox", name="Name*").click()
    page.get_by_role("textbox", name="Name*").fill(dataset_name)
    page.get_by_role("button", name="Create Dataset").click()
    expect(page).to_have_url(re.compile(r".*/dataset/.*"))
    expect(page.get_by_role("main")).to_contain_text(dataset_name)

    return page.url.split("/")[-1]


@pytest.fixture
def create_test_node(page, login):
    """
    Fixture that sets up an independent node template to be used for testing. Automatically runs login fixture.
    Automatically navigates to the node editor for the created node,
    but can be navigated to as such: `page.goto("http://localhost:5173/template/" + create_test_node)`.
    Returns the node template ID."""
    dataset_name = f"Generated Test Node: {random.randint(0, 1000)}"
    # Create new map
    page.goto("http://localhost:5173/template/new")
    # Fill out new map creation form
    page.get_by_role("textbox", name="Name*").click()
    page.get_by_role("textbox", name="Name*").fill(dataset_name)
    page.get_by_role("button", name="Create Template").click()
    expect(page).to_have_url(re.compile(r".*/template/.*"))
    expect(page.get_by_role("main")).to_contain_text(dataset_name)

    return page.url.split("/")[-1]


@pytest.fixture
def create_test_user(page, login):
    """
    Fixture that sets up a user in /settings for HTTP Basic Auth. Do not use if not using Basic Auth.
    Creates the user with an autogenerated username, name as "Test", and default (Read-Only) role permissions.
    Automatically runs login fixture and navigates to the setting page.
    Returns the autogenerated username of the user.
    """
    page.goto("http://localhost:5173/settings")
    expect(page.get_by_text("Settings for user accounts for HTTP Basic Auth.")).to_be_visible()
    # wait for user table to stabilize and whatnot
    page.wait_for_timeout(1000)
    create_user_button = page.get_by_role("button", name="Add User")
    create_user_button.click()
    new_row = page.locator("tr").filter(has=page.get_by_role("button", name="Save new user"))
    expect(new_row).to_be_visible()  # typically fails if user table hasn't yet stabilized

    username = f"Generated Test User: {random.randint(0, 1000)}"
    name = "Test Name"
    password = "Test Password"

    page.locator('input[name="name"]').fill(name)
    page.locator('input[name="username"]').fill(username)
    page.locator('input[name="password"]').fill(password)
    page.get_by_role("button", name="Save new user").click()
    user_table = page.locator("#table-form")
    expect(user_table).to_contain_text(username)
    expect(user_table).to_contain_text(name)
    expect(create_user_button).to_be_enabled()

    return username
