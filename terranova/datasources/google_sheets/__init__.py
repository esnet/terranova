# flake8: noqa
# this file describes the plugin entrypoint
from .settings import METADATA, configure

# plugin architecture uses 'configure' to set settings
configure()

# plugin architecture assumes a caching entrypoint called "fetch"
from .fetcher import main as fetch

# plugin architecture assumes a "router" instance
from .router import router
from .backend import GoogleSheetsBackend

# plugin architecture assumes "backend" instance
backend = GoogleSheetsBackend()

# plugin architecture assumes we have a datatype definition
metadata = lambda: backend.list_datasources() or METADATA
