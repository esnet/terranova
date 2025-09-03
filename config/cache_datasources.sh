#!/bin/sh

echo "Caching Datasources..."
# run terranova datasource caching
PYTHONPATH=/terranova /usr/local/bin/cache-datasources

echo "Datasource cache complete. Next run in 2 minutes."
# sleep for two minutes
sleep 120
# exit with non-zero so we are recycled by supervisor
exit 1