# Terranova

An app for building and editing maps

- [Getting Started](#getting-started)

## Getting Started

### Clone this repo

```
git clone git@github.com:esnet/terranova.git
```

### Copy default default configs

```
sudo cp -R terranova/etc/terranova /etc/
```

This will create a directory named /etc/terranova with two files:
```
settings.js
settings.yml
```

The `settings.js` file contains frontend settings, while `settings.yml` contains backend settings.


### Get an API token from Google

Terranova uses service accounts for authentication for spreadsheets. A Google service account can be configured within a project, which in turn belongs to an account or an organization. This differs from a normal user account.

The project that the service account is associated with needs to be granted access to the Google Sheets API and the Google Drive API.

The Google Sheets data source uses the scope https://www.googleapis.com/auth/spreadsheets.readonly to get read-only access to spreadsheets. It also uses the scope https://www.googleapis.com/auth/drive.metadata.readonly to list all spreadsheets that the service account has access to in Google Drive.

To create a service account, generate a Google JWT file and enable the APIs:

- Before you can use the Google APIs, you need to enable them in your Google Cloud project.
  - Open the Google Sheets API page and click enable.
  - Open the Google Drive API page and click enable.
- Open the Credentials page in the Google API Console.
- Click Create Credentials then Service account.
- Fill out the service account details form and then click Create and continue.
- Ignore the Service account permissions and Principals with access sections, just click Done.
- Click into the details for the service account, navigate to the Keys tab, and click Add Key. Choose key type JSON and click Create. A JSON key file will be created and downloaded to your computer.
- Save the token to `/etc/terranova/private_jwt.json`
- Grant read permission to spreadsheets that conform to the [Terranova Topology Format](https://docs.google.com/spreadsheets/d/191BuMoWa2CooMXJQzyNtBRlNLHamBmh-8PCoIGDELxA/edit)


### Build and start docker image

Overall the docker process uses `docker compose` to start an ElasticSearch image (for map persistence) as well as the application container for Terranova.

```
cd terranova  # change directory to the repo you just cloned
docker compose build  # this command builds the terranova docker image
docker compose up  # this command starts the elasticsearch and terranova image
```
