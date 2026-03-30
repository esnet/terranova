# this makefile is intended to encapsulate key commands that an average developer can use to manage the project's lifecycle.
# put the makefile here so we don't need to document or remember the gory details of the docker commands 
# and other specifics about the project's run environment

SHELL=/bin/bash
FRONTEND_DIR := terranova/frontend
VENV_DIR=.venv

ifdef TERRANOVA_CONF
TEST_CONFIG := $(TERRANOVA_CONF)
else
TEST_CONFIG := ./SAMPLE_CONFIG.yml
endif

.PHONY: run
run: node_modules venv
	@echo "Starting API and Frontend side-by-side (Ctrl+C to stop both)..."
	@trap 'kill 0' EXIT; \
	(cd $(FRONTEND_DIR) && pnpm run dev 2>&1 | sed 's/^/[FRONTEND] /' & \
	$(VENV_DIR)/bin/uvicorn terranova.api:app --reload 2>&1 | sed 's/^/[API] /' & \
	wait)


# ----- FRONTEND TARGETS -----
.PHONY: run_frontend
run_frontend: node_modules
	cd $(FRONTEND_DIR) && pnpm run dev

.PHONY: run_frontend_bg
run_frontend_bg: node_modules
	@cd $(FRONTEND_DIR) && pnpm run dev &

.PHONY: build
build: node_modules
	cd ${FRONTEND_DIR} && pnpm run build


# ----- BACKEND TARGETS -----
.PHONY: run_api
run_api: venv fetch
	$(VENV_DIR)/bin/uvicorn terranova.api:app --reload

# make fetch, populate sqlite3 db from datasources (google sheet)
.PHONY: fetch
fetch: venv
	$(VENV_DIR)/bin/python3 -m terranova.datacacher


# ----- TESTING TARGETS -----
.PHONY: test
test: frontend-test api-test

# run tests in a headed browser, allowing better analysis of test failures
.PHONY: frontend-test-headed
frontend-test-headed: venv node_modules
	cd ${FRONTEND_DIR} && pnpm run build-test
	$(VENV_DIR)/bin/pytest tests/frontend --headed

.PHONY: frontend-test
frontend-test: venv node_modules
	cd ${FRONTEND_DIR} && pnpm run build-test
	$(VENV_DIR)/bin/pytest tests/frontend


.PHONY: api-test
api-test: venv
	TERRANOVA_CONF=$(TEST_CONFIG) $(VENV_DIR)/bin/pytest -v

.PHONY: test_anonymous_api_access
test_anonymous_api_access: venv
	TERRANOVA_CONF=$(TEST_CONFIG) $(VENV_DIR)/bin/pytest -v -s tests/*.py -m anonymous

# ----- UTILITY/ENVIRONMENT TARGETS -----
install: venv node_modules
	$(VENV_DIR)/bin/pip install -r requirements-dev.txt || (echo "Failed to install requirements-dev.txt, stopping here." && exit 1)

# Recompile requirements.txt and requirements-dev.txt from their .in source files.
# Run this after editing requirements.in or requirements-dev.in, then commit all four files.
.PHONY: compile-requirements
compile-requirements: venv
	$(VENV_DIR)/bin/pip-compile requirements.in -o requirements.txt
	$(VENV_DIR)/bin/pip-compile requirements-dev.in -o requirements-dev.txt

# these targets ensure that the node modules are installed
$(FRONTEND_DIR)/node_modules:
	cd $(FRONTEND_DIR) && pnpm i

.PHONY: node_modules
node_modules: $(FRONTEND_DIR)/node_modules

# these targets ensure that the venv is created and all packages are installed.
# requirements.txt and requirements-dev.txt are generated lockfiles — to add or update
# a dependency, edit requirements.in or requirements-dev.in and run `make compile-requirements`.
$(VENV_DIR):
	python3 -m venv $(VENV_DIR)
	$(VENV_DIR)/bin/pip install pip-tools
	$(VENV_DIR)/bin/pip install -r requirements.txt || (echo "Failed to install requirements.txt, stopping here." && exit 1)
# 	install with --no-deps flag since they were installed above
	$(VENV_DIR)/bin/pip install -e . --no-deps || (echo "Failed to finish setup.py, stopping here." && exit 1)

# include venv target as a dependency anywhere it needs to exist
.PHONY: venv
venv: $(VENV_DIR)

.PHONY: clean
clean:
	rm -rf $(VENV_DIR)
	rm -rf $(FRONTEND_DIR)/node_modules
	rm -rf terranova/client


# ----- DOCUMENTATION TARGETS -----
.PHONY: docs
docs: venv
	$(VENV_DIR)/bin/pip install -r requirements-docs.txt
	$(VENV_DIR)/bin/mkdocs build

.PHONY: serve-docs
serve-docs: venv
	$(VENV_DIR)/bin/pip install -r requirements-docs.txt
	$(VENV_DIR)/bin/mkdocs serve
