# this makefile is intended to encapsulate key commands that an average developer can use to manage the project's lifecycle.
# put the makefile here so we don't need to document or remember the gory details of the docker commands 
# and other specifics about the project's run environment

SHELL=/bin/bash
FRONTEND_DIR := terranova/frontend
CURRENT_DIR = $(shell pwd)

ifdef TERRANOVA_CONF
TEST_CONFIG := $(TERRANOVA_CONF)
else
TEST_CONFIG := ./SAMPLE_CONFIG.yml
endif

.PHONY: run
run:
	cd ${FRONTEND_DIR} && yarn run dev
#	docker run stuff

# make run_api
.PHONY: run_api
run_api:
	uvicorn terranova.api:app --reload

.PHONY: frontend-test
frontend-test:
	cd ${FRONTEND_DIR} && npm install && npm run build-css && npm run build-test

# make test: test the frontend and API. Both are accomplished with pytest.
.PHONY: api-test
api-test:
	TERRANOVA_CONF=$(TEST_CONFIG) python3 -m pytest -v

.PHONY: test
test: frontend-test api-test

.PHONY: test_anonymous_api_access
test_anonymous_api_access:
	TERRANOVA_CONF=$(TEST_CONFIG) python3 -m pytest -v -s tests/*.py -m anonymous

.PHONY: build
build:
	@cd ${FRONTEND_DIR} && yarn run build

# make fetch, populate sqlite3 db from esdb
.PHONY: fetch
fetch:
	python3 -m terranova.datasources.esdb.fetcher

# make run_staging, perhaps, points to the staging instance of ES
.PHONY: run_staging
run_staging:
	docker run different options to point to staging

.PHONY: clean
clean:
	rm -rf ${FRONTEND_DIR}/node_modules
	rm -rf terranova/client
