# flake8: noqa
import yaml
import os
import sys
import random
import string

DEFAULT_CONFIG_FILE = "/etc/terranova/settings.yml"

CONFIG_FILENAME = os.environ.get("TERRANOVA_CONF", DEFAULT_CONFIG_FILE)
LOGLEVEL = os.environ.get("LOGLEVEL", "WARNING").upper()

config = None
try:
    with open(CONFIG_FILENAME) as f:
        config = yaml.safe_load(f)
except Exception as e:
    print(f"Unable to read config file {CONFIG_FILENAME} -- {e}")
    sys.exit(1)

ENVIRONMENT = config.get("environment", "")
VERSION = config.get("version")
SERVICENAME = "terranova"

STORAGE = config.get("storage", {})  # Storage backend configuration
STORAGE_BACKEND = STORAGE.get("backend", "sqlite")  # Default to sqlite for simplicity

ELASTIC = config.get("elastic", {})  # default to empty dict so we can set further defaults
AUTH = config.get("auth", {})
KEYCLOAK = config.get("keycloak", {})  # default to empty dict so we can set further defaults
BASIC_AUTH = config.get("basic_auth", {})
OTLP = config.get("otlp", {})

DATASOURCES = config.get("datasources", {})
if DATASOURCES is None:
    DATASOURCES = {}

ELASTIC_USER = ELASTIC.get("username")
ELASTIC_PASS = ELASTIC.get("password")
ELASTIC_URL = ELASTIC.get("url")
ELASTIC_INDICES = {
    "template": {
        "read": ELASTIC.get("indices", {}).get("template", {}).get("read"),
        "write": ELASTIC.get("indices", {}).get("template", {}).get("write"),
    },
    "map": {
        "read": ELASTIC.get("indices", {}).get("map", {}).get("read"),
        "write": ELASTIC.get("indices", {}).get("map", {}).get("write"),
    },
    "dataset": {
        "read": ELASTIC.get("indices", {}).get("dataset", {}).get("read"),
        "write": ELASTIC.get("indices", {}).get("dataset", {}).get("write"),
    },
    "userdata": {
        "read": ELASTIC.get("indices", {}).get("userdata", {}).get("read"),
        "write": ELASTIC.get("indices", {}).get("userdata", {}).get("write"),
    },
}

# Only validate Elasticsearch indices if using elasticsearch backend
if STORAGE_BACKEND == "elasticsearch":
    for index, value in ELASTIC_INDICES.items():
        for name, endpoint in value.items():
            if endpoint is None:
                raise RuntimeError(
                    "Misconfiguration in elastic.indices. Please provide a read and write index for %s.\n\n Current values: \n%s"
                    % (
                        ", ".join([k for k in ELASTIC_INDICES.keys()]),
                        yaml.safe_dump(ELASTIC.get("indices")),
                    )
                )

# SQLite configuration
SQLITE_DB_PATH = STORAGE.get("sqlite_path", "./terranova.db")

KEYCLOAK_SERVER = KEYCLOAK.get("server")
KEYCLOAK_REALM = KEYCLOAK.get("realm")
KEYCLOAK_CLIENT = KEYCLOAK.get("client")
KEYCLOAK_SECRET = KEYCLOAK.get("client_secret")
KEYCLOAK_PUBLIC_KEY = KEYCLOAK.get("public_key")

AUTH_BACKEND = AUTH.get("backend")

BASIC_AUTH_DB_FILENAME = BASIC_AUTH.get("db_filename", "/tmp/basic_auth.sqlite")

TOKEN_SCOPES = {
    "read": AUTH.get("read_scope", "terranova:maps:read"),
    "write": AUTH.get("write_scope", "terranova:maps:write"),
    "publish": AUTH.get("publish_scope", "terranova:maps:publish"),
    "admin": AUTH.get("admin_scope", "terranova:admin"),
}

# OpenTelemetry Configuration
OTLP_ENDPOINT = OTLP.get("endpoint")
OTLP_SECRET = OTLP.get("secret_key")

# Only used for unit testing, generates a random "key" for signing
# of the JWTs used for auth
TEST_JWT_KEY = "".join(random.choices(string.ascii_uppercase + string.digits, k=20))

DEFAULT_NODE_TEMPLATES = {
    "GEOGRAPHIC": "<g><rect x='-4' y='-4' width='8' height='8' /></g>",
    "LOGICAL": """<g><foreignObject width="30" height="15" overflow="visible"><div xmlns="http://www.w3.org/1999/xhtml" style="border: 1px solid rgba(0,0,0,0.2); padding: 2px 5px; border-radius:15px; font-size:10px; background: white; text-align:center; margin-left:-30px; margin-top:-15px;">{{endpoint_name}}</div></foreignObject></g>""",  # noqa: E501
}

SVG_OUTPUT_TEMPLATE = """
    <svg viewBox="{{ viewbox["min"]["x"] }} {{ viewbox["min"]["y"] }} {{ viewbox["delta"]["x"] }} {{ viewbox["delta"]["y"] }}" xmlns="http://www.w3.org/2000/svg" xmlns:xhtml="http://www.w3.org/1999/xhtml">
        <style>
        foreignObject, text { font-family:Arial,Helvetica,sans-serif; }
        </style>
        {% for layer in layers %}
        {% for node in layer["groups"] %}
            <g transform="translate({{ node["coordinate"][1] }}, {{ node["coordinate"][0] }})">
              <g transform="scale({{node_scale_factor}})" fill="{{ configuration["layers"][layer["index"]]["color"] }}" stroke-width="{{ layer["node_stroke_width"]}}" stroke="black">
              {{ node["meta"]["svg"] }}
              </g>
            </g>
        {% endfor %}
        {% for edge in layer["edges"] %}
            <path d="{{ edge["computed_path"] }}" stroke="{{ configuration["layers"][layer["index"]]["color"] }}" fill="none" stroke-width="{{layer["edge_stroke_width"]}}" />
        {% endfor %}
        {% for node in layer["nodes"] %}
            <g transform="translate({{ node["coordinate"][1] }}, {{ node["coordinate"][0] }})">
              <g transform="scale({{node_scale_factor}})" fill="{{ configuration["layers"][layer["index"]]["color"] }}" stroke-width="{{ layer["node_stroke_width"]}}" stroke="black">
              {{ node["meta"]["svg"] }}
              </g>
            </g>
        {% endfor %}
    {% endfor %}
    </svg>
"""
