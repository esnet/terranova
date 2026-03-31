# Google Sheets Setup

Terranova uses Google service accounts to read topology data from Google Sheets. This guide walks through creating a service account, generating credentials, and configuring Terranova to use them.

## Prerequisites

- A Google account with access to [Google Cloud Console](https://console.cloud.google.com/)
- A Google Sheets spreadsheet in the [Terranova Topology Format](https://docs.google.com/spreadsheets/d/191BuMoWa2CooMXJQzyNtBRlNLHamBmh-8PCoIGDELxA/edit)

## 1. Enable the required APIs

In the [Google Cloud Console](https://console.cloud.google.com/):

1. Open [**Google Sheets API**](https://console.cloud.google.com/apis/library/sheets.googleapis.com) and click **Enable**
2. Open [**Google Drive API**](https://console.cloud.google.com/apis/library/drive.googleapis.com) and click **Enable**

Terranova uses:

- `https://www.googleapis.com/auth/spreadsheets.readonly` — to read spreadsheet data
- `https://www.googleapis.com/auth/drive.metadata.readonly` — to list accessible spreadsheets

## 2. Create a service account

1. Go to [**IAM & Admin → Service Accounts**](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Click **Create Service Account**
3. Fill in a name and description, then click **Create and Continue**
4. Skip the "Service account permissions" and "Grant users access" steps — click **Done**

## 3. Generate a JSON key

1. Click on the service account you just created
2. Go to the **Keys** tab
3. Click **Add Key → Create new key**
4. Select **JSON** and click **Create**
5. A JSON file is downloaded to your computer — keep this file secure

## 4. Install the credential file

Copy the downloaded JSON file to `/etc/terranova/private_jwt.json`:

```sh
sudo cp ~/Downloads/your-service-account-key.json /etc/terranova/private_jwt.json
sudo chmod 600 /etc/terranova/private_jwt.json
```

## 5. Configure Terranova

In `/etc/terranova/settings.yml`, add the `google_sheets` datasource:

```yaml
datasources:
  google_sheets:
    credential_type: static
    cache_file: /var/tmp/google_sheets.sqlite
    static:
      token_files:
        - /etc/terranova/private_jwt.json
```

## 6. Share spreadsheets with the service account

For each spreadsheet you want to use as a datasource:

1. Open the spreadsheet in Google Sheets
2. Click **Share**
3. Add the service account's email address (found in the JSON file as `client_email`) with **Viewer** access

The service account can only read spreadsheets explicitly shared with it.

## 7. Populate the cache

After configuring the datasource, run a cache refresh to fetch the data:

```sh
make fetch
# or: python -m terranova.datacacher
```

This fetches data from all configured spreadsheets and stores it in the local cache file. The dataset endpoints will then appear in the Dataset Editor.

## Spreadsheet format

Spreadsheets must follow the [Terranova Topology Format](https://docs.google.com/spreadsheets/d/191BuMoWa2CooMXJQzyNtBRlNLHamBmh-8PCoIGDELxA/edit). Each row represents a circuit with columns for:

- Source and destination endpoint names
- Location names and coordinates (latitude/longitude)
- Circuit identifiers and metadata

Refer to the example spreadsheet for the exact column layout.
