from playwright.sync_api import expect

import pytest
import subprocess
import os
import shutil
import re
import time


@pytest.fixture
def setup_server_processes(request):
    # set "fact" about the parent of _this script_
    parent_dir = os.path.dirname(__file__)
    # path to top level dir. ugh.
    app_root = os.path.join(parent_dir, os.pardir, os.pardir)
    # path to doc root for pre-compiled frontend files
    frontend_docroot = os.path.join(app_root, "terranova", "frontend", "dist-test")
    # path to the config file for the API for these tests
    test_config_path = os.path.join(parent_dir, "config.yml")
    # path to the JS settings file for these tests
    js_settings_source_path = os.path.join(parent_dir, "settings.js")
    # path to the copy target for the JS settings file
    js_settings_target_path = os.path.join(frontend_docroot, "static", "settings.js")

    # overwrite the ephemeral JS settings file
    shutil.copyfile(js_settings_source_path, js_settings_target_path)

    frontend_server = "%s/frontend_server.py" % parent_dir

    # spawn a simple http server from the frontend docroot, serving the pre-compiled frontend files
    js_proc = subprocess.Popen(
        ["python", frontend_server], cwd=frontend_docroot, universal_newlines=True
    )

    # create an environment for the API server
    api_env = os.environ.copy()
    api_env["TERRANOVA_CONF"] = test_config_path
    api_env["MOCKS"] = "tests.google_sheets.mocks"
    api_proc = subprocess.Popen(["uvicorn", "terranova.api:app"], env=api_env, cwd=app_root)

    time.sleep(2)

    def teardown_processes():
        js_proc.kill()
        api_proc.kill()

    request.addfinalizer(teardown_processes)

    return True


def test_basic_render(setup_server_processes, page):
    page.goto("http://localhost:5173/")

    expect(page).to_have_title(re.compile("Terranova"))


def test_google_sheets_filters_multi_select(setup_server_processes, page):
    page.goto("http://localhost:5173/")
    page.locator('input[name="username"]').click()
    page.locator('input[name="username"]').fill("admin")
    page.locator('input[name="username"]').press("Tab")
    page.locator('input[name="password"]').fill("admin")
    page.locator('input[name="password"]').press("Enter")
    page.get_by_role("button", name="Login").click()
    page.get_by_role("listitem").filter(has_text=re.compile(r"^Datasets$")).get_by_role(
        "img"
    ).click()
    page.get_by_role("link", name="Datasets").click()
    page.get_by_role("button", name="+ Create New").click()
    page.locator("#dataset-name").click()
    page.locator("#dataset-name").fill("--Test Dataset Google Sheets--")
    page.get_by_role("button", name="Create Dataset").click()
    expect(page.locator("#dataset-display-name")).to_be_visible()
    page.locator("#dataset-selector").select_option(
        "google_sheets?sheet_id=1nm4QQbpVW_bqonsSo3j0ttNZeyJvcCG3Zg6Japr5L8k"
    )
    expect(page.locator("#dataset-selector")).to_have_value(
        "google_sheets?sheet_id=1nm4QQbpVW_bqonsSo3j0ttNZeyJvcCG3Zg6Japr5L8k"
    )
    page.locator("#add-query-criterion").click()
    page.get_by_role("searchbox", name="Filter Names...").click()
    page.locator("#lower-main-pane").get_by_role("listbox").select_option("A--B")
    expect(page.get_by_role("form")).to_contain_text("1 circuit")
    page.get_by_role("searchbox", name="Filter Names...").click()
    page.locator("#lower-main-pane").get_by_role("listbox").select_option(
        ["A--B", "A--Z", "B--Z", "L--Z"]
    )
    expect(page.get_by_role("form")).to_contain_text("4 circuits")
