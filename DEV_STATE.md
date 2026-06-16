# Development State — Terranova E2E Test Suite

## What's Done

### Bug Fixes Applied
1. **Fix 1** (ProtectedRoute flash): Added `isLoading` guard — no interstitial login page flash
2. **Fix 2** (FavoritesContextProvider): Stores full objects from API, not bare IDs
3. **Fix 3** (FavLinkList): Uses correct idField/urlPrefix per dataType (maps/datasets/templates)
4. **Fix 4** (LastEditedContextProvider): Sort now uses correct idField per datatype; stores full objects
5. **Fix 5+6** (abstract_models.py): Added `number` type handler for float fields; guarded `get_unique_values` with `isinstance(x[0], str)` before char indexing
6. **Fix 7** (Home.page.tsx): Changed `navigation("/templates/new")` → `navigation("/template/new")`
7. **conftest.py session scope**: `setup_server_processes` changed to `scope="session", autouse=True`; `time.sleep(2)` replaced with health-check poll (30×200ms); `fresh_db` session fixture added (deletes both DB files before session)

### Tests Written/Fixed
- `test_dataset_editor.py` — all 6 tests passing; all selectors updated for Packets UI combobox pattern
- `test_node_template.py::test_create_node_template` — fixed strict mode violation, correct assertions
- `test_home.py` — `test_new_buttons`, `test_favorites`, `test_view_libraries` passing; `test_recent_maps`/`test_recent_datasets` failing (see below)
- `test_map_editor.py` — written but not fully verified
- `test_sidebar.py` — written but failing
- `test_node_template_editor.py` — written but not verified
- `test_auth.py` — written but not verified
- `test_navigation.py` — errors (not examined yet)

---

## Current Failures (as of last full run: 11 failed, 49 passed, 5 errors, ~252s)

### `test_recent_maps` / `test_recent_datasets` (test_home.py)

**Root cause being investigated**: Two 500 errors from the API during these tests:

1. `GET /maps/?fields=...&version=all HTTP/1.1` → **500** (map editor fetches all versions)
2. `GET /map/id/{mapId}/ HTTP/1.1` → **500** (map editor loads the just-created map)

And one 422:
- `PUT /userdata/ HTTP/1.1` → **422 Unprocessable Content** (save map tries to update lastEdited)

Because the map editor fails to load (500 on map fetch), and/or `lastEdited` never gets saved (422 on userdata PUT), the home page shows no recent maps.

**Suspected cause of 422**: Unknown — `UserDataRevision` model accepts `{favorites: Dict[str, List[str]], lastEdited: Dict[str, List[str]]}`. The frontend sends these as string arrays. Need to see the actual 422 error body.

**Suspected cause of 500 on `GET /map/id/{mapId}/`**: FastAPI validates the return type `-> Map`. If any required field is missing/wrong type in the stored document, FastAPI raises a 500 response validation error. The map was just created (POST returned 200 OK), so this is puzzling. The 500 on `GET /maps/?version=all` (before the map even exists) is also unexplained.

**Next step**: Run the API directly to reproduce and capture the actual exception traceback:
```bash
TERRANOVA_CONF=tests/frontend/mock/settings.yml MOCKS=tests.frontend.mock.mocks \
  python -c "
from terranova.backends.storage import get_storage_backend
# create a map and GET it back, capture any exception
"
```
Or add `--log-cli-level=ERROR` to pytest to see server tracebacks in test output.

### `test_sidebar.py` (5 tests failing)
- `test_create_dataset_sidebar`, `test_create_map_sidebar`, `test_svg_builder_sidebar`
- `test_sidebar_datasets_count_and_order`, `test_sidebar_maps_count_and_order`
- Likely related to sidebar requiring BOTH `lastEdited` AND `lastGlobal` contexts to be non-empty
- The 500 errors above may cascade here too

### `test_navigation.py` (4 errors)
- `test_sidebar_shows_recently_created_maps/datasets`
- `test_sidebar_navigation_between_map_editors/dataset_editors`
- Errors (not failures) — likely import or fixture errors, not yet examined

### `test_dataset.py::test_create_forked_dataset`
- Still failing, not yet examined

### `test_map.py::test_output_map_svg`
- `KeyError: 'esdb'` in `output.py:dataset_output` — datasource 'esdb' not registered in test mock

---

## Files Modified
```
terranova/frontend/src/components/ProtectedRoute.component.tsx   # Fix 1
terranova/frontend/src/context/FavoritesContextProvider.tsx      # Fix 2
terranova/frontend/src/pages/Home.page.tsx                       # Fix 3, Fix 7
terranova/frontend/src/context/LastEditedContextProvider.tsx     # Fix 4
terranova/abstract_models.py                                     # Fix 5+6
tests/frontend/conftest.py                                       # session scope, fresh_db
tests/frontend/test_dataset_editor.py                           # rewritten
tests/frontend/test_node_template.py                            # fixed
tests/frontend/test_home.py                                     # new tests added
tests/frontend/test_map_editor.py                               # new (not fully verified)
tests/frontend/test_sidebar.py                                  # new (failing)
tests/frontend/test_node_template_editor.py                     # new (not verified)
tests/frontend/test_auth.py                                     # new (not verified)
```

## Frontend Rebuild Required
After any `.tsx` change, run:
```bash
cd terranova/frontend && pnpm run build-test
```
Then run tests. The current test run uses whatever was last compiled.

## How to Run Tests
```bash
# Specific file (fast):
.venv/bin/pytest tests/frontend/test_home.py -x --tb=short

# Single test:
.venv/bin/pytest tests/frontend/test_home.py::test_recent_maps -x --tb=short

# Full suite (~4 min):
make frontend-test
```
