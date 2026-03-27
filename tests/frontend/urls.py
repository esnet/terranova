"""
Configurable base URLs for the frontend test suite.

Override the defaults by setting environment variables before running pytest:

    TERRANOVA_TEST_FRONTEND_PORT=5200 TERRANOVA_TEST_API_PORT=8100 pytest tests/frontend

This lets you run the test suite against non-default ports so normal frontend
development (vite on 5173, uvicorn on 8000) can continue in another terminal.
"""

import os

FRONTEND_PORT = int(os.environ.get("TERRANOVA_TEST_FRONTEND_PORT", "4321"))
API_PORT = int(os.environ.get("TERRANOVA_TEST_API_PORT", "8765"))
FRONTEND_BASE = f"http://localhost:{FRONTEND_PORT}"
API_BASE = f"http://localhost:{API_PORT}"
