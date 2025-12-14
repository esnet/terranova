# Terranova

An app for building and editing maps

- [Getting Started](#getting-started)
- [Development](#development)

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

## Development

To develop Terranova, you'll still need to do all of the above, stopping at building a Docker image.

### Prerequisites

Various libraries and packages used in Terranova have other dependencies that may need to be installed. These specifically include:

- [`pygraphviz`](https://pygraphviz.github.io/), needing [`graphviz`](https://pygraphviz.github.io/documentation/stable/install.html). If you are on a Mac, you make encounter an error failing to build the pygraphviz wheel. To resolve this, you'll need to comment out pygraphviz in requirements.txt, allowing all other packages to install, then follow these [instructions](https://pygraphviz.github.io/documentation/stable/install.html#macos) to resolve.

- [`Elasticsearch`](https://www.elastic.co/docs/deploy-manage/deploy/self-managed/local-development-installation-quickstart). TODO: Add elasticsearch installation and setup instructions. In the meantime, you comment out the `terranova` service in the Docker compose file, and run `docker compose up` to emulate. 

Terranova also uses Python3 (3.11 is specified in the Dockerfile) and Node.js.

### Make

Once the above is completed, all further environment installations and development processes can be done from the Makefile. The Makefile is used to encapsulate all commands that may be needed to run any part of the project. You'll need to run the following in seperate shells.

Start the Elasticsearch service (see prerequisites!)
```sh
docker compose up
```

Run the Python API (creates venv and installs requirements automatically).
```sh
make run_api
```

Run the Node frontend development server (installs Node modules automatically).
```sh
make run_frontend
```

Additional useful Makefile targets include 
- `make install`: Install both frontend and backend Python packages and Node modules.
- `make test`: Test both frontend and backend (may have to install Playwright headless browsers).
- `make build`: Produce frontend build in `/terranova/frontend/dist`
- `make clean`: Remove the Python virtual environment and all Node modules.
