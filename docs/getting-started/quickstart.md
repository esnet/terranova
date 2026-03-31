# Quickstart

The fastest way to run Terranova is with Docker Compose. This starts the application and an Elasticsearch instance with a single command.

## 1. Clone the repository

```sh
git clone git@github.com:esnet/terranova.git
cd terranova
```

## 2. Copy the default configuration

```sh
sudo cp -R etc/terranova /etc/
```

This creates `/etc/terranova/` containing two files:

- `settings.yml` — backend configuration (storage, datasources, auth)
- `settings.js` — frontend configuration (API URL)

## 3. Configure a storage backend

The default `settings.yml` is configured for Elasticsearch (used by Docker Compose). If you want to use SQLite instead — which requires no additional services — see the [Storage Backends](../deployment/storage-backends.md) guide.

For the Docker quickstart, no changes are needed. The `compose.yaml` starts an Elasticsearch container automatically.

## 4. Build and start

```sh
docker compose build
docker compose up
```

This starts two containers:

- **Elasticsearch** — data storage
- **Terranova** — the application (API + frontend, served by Apache)

## 5. Open the app

Once both containers are running, open your browser to:

```
http://localhost:80
```

Log in with the default credentials configured in your `settings.yml`. With basic auth (the default for new installs), the username and password are set in the `basic_auth` section of the config file.

## Next steps

- [Create your first dataset](../user-guide/creating-a-dataset.md)
- [Create your first map](../user-guide/creating-a-map.md)
- [Configure a Google Sheets datasource](../deployment/google-sheets-setup.md)
