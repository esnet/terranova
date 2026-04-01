import os
import sys
from terranova.backends.storage import backend
from terranova.settings import STORAGE_BACKEND

# Only check Elasticsearch connection if using Elasticsearch backend
if STORAGE_BACKEND == "elasticsearch":
    try:
        if not backend.is_connected():
            print("Elasticsearch connection not detected. Exiting.")
            sys.exit(1)
    except Exception:
        print("Elasticsearch connection not detected. Exiting.")
        sys.exit(1)

# fastapi
from fastapi import FastAPI, Request
from fastapi_versioning import version
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# import routers
from terranova.api.routers import (
    datasets,
    maps,
    userdata,
    templates,
    output,
    basic_auth,
    datasources as datasources_router,
)

# for error reporting into traces
from opentelemetry.context import get_current as get_current_context

from terranova.backends.datasources import datasources

from terranova.settings import ENVIRONMENT, AUTH_BACKEND
import terranova.opentelemetry
from terranova.request import RequestContextMiddleware

# Elasticsearch requires index creation before use
if STORAGE_BACKEND == "elasticsearch":
    backend.create_indices()

# Seed default node templates if none exist (safe to run on every startup)
backend.initialize_templates()

app = FastAPI(title="Terranova API")
app.add_middleware(RequestContextMiddleware)

# attach our sub routers onto the fastapi app
for lib in [maps, datasources_router, datasets, templates, output, userdata]:
    app.include_router(lib.router)

for ds in datasources:
    app.include_router(datasources[ds].router)

if AUTH_BACKEND == "basic":
    app.include_router(basic_auth.router)

cors_env = os.environ.get("TERRANOVA_CORS_ORIGINS")
if cors_env:
    # Explicit comma-separated origins, e.g. "http://example.com,http://other.com"
    origins = [o.strip() for o in cors_env.split(",")]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
elif ENVIRONMENT == "dev":
    origins = [
        "http://localhost",
        "http://localhost:5173",
        "http://localhost:3001",
        "http://127.0.0.1",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3001",
    ]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
# In production without TERRANOVA_CORS_ORIGINS: no CORS headers needed —
# the frontend and API are served same-origin through Apache.

# set up test mocks in test environment
if ENVIRONMENT == "test":
    MOCKS = os.environ.get("MOCKS")
    __import__(MOCKS)


# Used to get the current OTLP span
def _get_current_span():
    span_list = list(get_current_context().keys())

    if len(span_list) == 0:
        return None

    span_key = span_list[-1]
    return get_current_context().get(span_key)


# Used to get the current traceID for reporting into
# http headers
def _get_current_trace():
    span = _get_current_span()
    if not span:
        return ""
    return str(hex(span.context.trace_id))


@app.middleware("http")
async def add_response_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Cache-control"] = "no-store"
    response.headers["X-Trace-Id"] = _get_current_trace()
    return response


@app.exception_handler(500)
async def exception_handler(request: Request, exc: Exception):
    span = _get_current_span()
    trace_id = _get_current_trace()
    if span:
        span.record_exception(exc)
    content = {"message": "Server Error", "trace": trace_id}
    headers = {"X-Trace-Id": trace_id}
    return JSONResponse(content=content, headers=headers, status_code=500)


@app.get("/")
@version(1)
def endpoints_list():
    def format_route(route):
        output = {
            "path": route.path,
            "name": route.name,
            "methods": [method for method in route.methods],
        }
        return output

    url_list = [format_route(route) for route in app.routes]
    return url_list


app = terranova.opentelemetry.init_telemetry(fastapi_app=app, stdout=False)
