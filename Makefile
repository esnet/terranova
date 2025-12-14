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

# TODO: figure out how to create a single Make development target that runs
# - Docker/Elasticsearch
# - Start the backend
# - Start the frontend development server
.PHONY: run
run:
	@echo "To begin development on Terranova, you'll need to run three seperate processes to start Elasticsearch, Python API, and Node frontend."
	@echo "To see how, visit the Development section of the project's README.md."
	exit 1


# ----- FRONTEND TARGETS -----
.PHONY: run_frontend
run_frontend: node_modules
	@cd $(FRONTEND_DIR) && pnpm run dev

.PHONY: build
build: node_modules
	@cd ${FRONTEND_DIR} && pnpm run build


# ----- BACKEND TARGETS -----
.PHONY: run_api
run_api: venv
	$(VENV_DIR)/bin/uvicorn terranova.api:app --reload

# make fetch, populate sqlite3 db from esdb
.PHONY: fetch
fetch: venv
	$(VENV_DIR)/bin/python3 -m terranova.datasources.esdb.fetcher


# ----- TESTING TARGETS -----
.PHONY: test
test: frontend-test api-test

# run tests in a headed browser, allowing better analysis of test failures
.PHONY: frontend-test-headed
frontend-test-headed: venv node_modules
	@cd ${FRONTEND_DIR} && pnpm run build-test
	$(VENV_DIR)/bin/pytest tests/frontend --headed

.PHONY: frontend-test
frontend-test: venv node_modules
	@cd ${FRONTEND_DIR} && pnpm run build-test
	$(VENV_DIR)/bin/pytest tests/frontend


.PHONY: api-test
api-test: venv
	TERRANOVA_CONF=$(TEST_CONFIG) $(VENV_DIR)/bin/pytest -v

.PHONY: test_anonymous_api_access
test_anonymous_api_access: venv
	TERRANOVA_CONF=$(TEST_CONFIG) $(VENV_DIR)/bin/pytest -v -s tests/*.py -m anonymous

# TODO: make run_staging, perhaps, points to the staging instance of ES
.PHONY: run_staging
run_staging:
	docker run different options to point to staging


# ----- UTILITY/ENVIRONMENT TARGETS -----
# these targets ensure that the node modules are installed
$(FRONTEND_DIR)/node_modules:
	@cd $(FRONTEND_DIR) && pnpm i

.PHONY: node_modules
node_modules: $(FRONTEND_DIR)/node_modules

# these targets ensure that the venv is created and the Python packages are installed
$(VENV_DIR):
	python3 -m venv $(VENV_DIR)
	$(VENV_DIR)/bin/pip install -r requirements.txt || (echo "Failed to install requirements.txt, stopping here." && exit 1)

# include venv target as a dependency anywhere it needs to exist
.PHONY: venv
venv: $(VENV_DIR)

.PHONY: clean
clean:
	rm -rf $(VENV_DIR)
	rm -rf $(FRONTEND_DIR)/node_modules
	rm -rf terranova/client
