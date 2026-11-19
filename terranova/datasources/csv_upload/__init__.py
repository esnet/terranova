# flake8: noqa
# this file describes the plugin entrypoint
from .settings import METADATA, configure

# plugin architecture uses 'configure' to set settings
configure()

# plugin architecture assumes a caching entrypoint called "fetch"
# CSV data arrives via POST upload, not periodic fetch; this is a no-op
from .parser import fetch

# plugin architecture assumes a "router" instance
from .router import router
from .backend import CSVBackend

# plugin architecture assumes "backend" instance
backend = CSVBackend()

# plugin architecture assumes we have a datatype definition
metadata = lambda: backend.list_datasources() or METADATA
