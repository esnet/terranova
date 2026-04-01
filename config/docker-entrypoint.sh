#!/bin/sh
set -e

mkdir -p /data

# Determine encryption key: env var > persisted key > auto-generate
if [ -n "$TERRANOVA_ENCRYPTION_KEY" ]; then
    KEY="$TERRANOVA_ENCRYPTION_KEY"
elif [ -f /data/.encryption_key ]; then
    KEY=$(cat /data/.encryption_key)
else
    KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
    echo "$KEY" > /data/.encryption_key
    chmod 600 /data/.encryption_key
fi

# Inject encryption key into settings (replaces the PLACEHOLDER value)
sed -i "s/encryption_key: PLACEHOLDER/encryption_key: $KEY/" /etc/terranova/settings.yml

# Generate custom-theme.css from TERRANOVA_CSS_* environment variables
python3 - << 'PYEOF'
import os
css_vars = {}
for key, val in os.environ.items():
    if key.startswith("TERRANOVA_CSS_"):
        prop = "--esnet-" + key[len("TERRANOVA_CSS_"):].lower().replace("_", "-")
        css_vars[prop] = val
css_path = "/terranova/terranova/frontend/dist/custom-theme.css"
with open(css_path, "w") as f:
    if css_vars:
        f.write(":root {\n")
        for prop, val in css_vars.items():
            f.write(f"    {prop}: {val};\n")
        f.write("}\n")
PYEOF

exec "$@"
