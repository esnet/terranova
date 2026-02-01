import pytest
import os
import shutil
import subprocess
import time


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
        page.locator('input[name="username"]').click()
        page.locator('input[name="username"]').fill("admin")
        page.locator('input[name="username"]').press("Tab")
        page.locator('input[name="password"]').fill("admin")
        page.locator('input[name="password"]').press("Enter")
        page.get_by_role("button", name="Login").click()
    else:
        raise Exception("Unsupported Auth Backend: " + AUTH_BACKEND)
