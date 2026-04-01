# Quickstart

The fastest way to run Terranova is with Docker. No cloning, no building — pull the pre-built image and go.

## Prerequisites

- [Docker Engine](https://docs.docker.com/engine/install/) 20.10+
- [Docker Compose](https://docs.docker.com/compose/install/) v2

## 1. Create a compose file

Create a file named `compose.yaml` with the following content:

```yaml
services:
    terranova:
        image: ghcr.io/esnet/terranova:latest
        ports:
            - 9999:80
        volumes:
            - terranova-data:/data
        environment:
            TERRANOVA_CORS_ORIGINS: "http://localhost:9999"

volumes:
    terranova-data:
```

## 2. Start the app

```sh
docker compose up
```

## 3. Open the app

Open your browser to:

```
http://localhost:9999
```

Log in with the default credentials:

- **Username:** `admin`
- **Password:** `admin`

## 4. Connect your data

Terranova displays topology data from Google Sheets. To connect a spreadsheet:

1. Go to **Settings** in the top navigation
2. Click **Add Google Sheets Datasource**
3. Paste your Google service account JSON key

!!! info "Getting a service account key"
    See the [Google Sheets Setup](../deployment/google-sheets-setup.md) guide for instructions on creating a service account and generating a JSON key.

## Next steps

- [Create your first dataset](../user-guide/creating-a-dataset.md)
- [Create your first map](../user-guide/creating-a-map.md)
- [Docker deployment reference](../deployment/docker.md)
