[![npm version](https://img.shields.io/badge/npm-9.5.1-green)](https://img.shields.io)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

# Terranova Frontend

React frontend webapp for Terranova

## Prerequisites

This software is internal to ESnet and dependent other ESnet repo packages. Authentication via .npmrc is required for building.

This project requires NodeJS (version 19.8.1 or later) and NPM (version 9.5.1 or later).
[Node](http://nodejs.org/) and [NPM](https://npmjs.org/) are really easy to install.
To make sure you have them available on your machine,
try running the following command.

```sh
$ npm -v && node -v
9.5.1
v19.8.1
```

You can easily sync to the version above by installing both through using [NVM](https://github.com/nvm-sh/nvm).

```sh
$ nvm install 19.8.1
$ nvm use 19.8.1
$ npm -v && node -v
9.5.1
v19.8.1
```

## Table of contents

- [Terranova Frontend](#terranova-frontend)
  - [Prerequisites](#prerequisites)
  - [Table of contents](#table-of-contents)
  - [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Serving the app](#serving-the-app)
    - [Running the tests](#running-the-tests)
    - [Building a distribution version](#building-a-distribution-version)
    <!-- - [Serving the distribution version](#serving-the-distribution-version) -->
  - [API](#api)
  - [Contributing](#contributing)
  - [Credits](#credits)
  - [Built With](#built-with)
  - [Versioning](#versioning)
  - [Authors](#authors)
  - [License](#license)

## Getting Started

These instructions will get the frontend of the project up and running on your local machine for development and testing purposes. See [deployment](#deployment) for notes on how to deploy the project on a live system.

## Installation

**BEFORE YOU INSTALL:** please read the [prerequisites](#prerequisites)

See the [README.md file for Terranova](https://gitlab.es.net/seg/terranova/-/blob/main/README.md) for repo clone instructions.

This README file assumes you've cloned the project into `/home/user/terranova`

To install and set up the frontend, run:

```sh
$ cd /home/user/terranova/terranova/frontend
$ npm install
```

### API Client

You must also run `generate-scripts` to build the API client prior to building the webapp. The API server must be running in order to generate the client.

```sh
$ cd /home/user/terranova
$ make run_api                                  # this runs the api server
$ cd /home/user/terranova/terranova/frontend
$ npm run generate-client                       # generates the client at terranova/frontend/src/client
```

Running the API server is not required while running the frontend in standalone mode (currently hardcoded).

## Usage

The standard way to start Terranova is via the shell using `make` in the project root directory, but using npm scripts is
also supported when using the shell in the terranova/terranova/frontend directory.

### Serving the app

Using make:

```sh
$ make run
```

Using npm:

```sh
$ npm run dev
```

This will also build the application locally in a `/dist` folder in the `terranova/frontend` directory.

### Running the tests

Using make (from the project root directory):

```sh
$ make test
```

Using npm (covers frontend and E2E tests only; in the terranova/frontend directory, e.g. this README file's location):
```sh
$ npm test
```

### Building a distribution version

```sh
$ npm run build
```

This task will create a distribution version of the project
inside your local `dist/` folder

<!-- ### Serving the distribution version -->

<!-- ```sh
$ npm run serve:dist
```

This will use `lite-server` for serving your already
generated distribution version of the project.

*Note* this requires
[Building a distribution version](#building-a-distribution-version) first. -->

## API

See `terranova/api/API Description Notes.md` for additional API information.

## Deployment

TBD

## Credits

TODO: Write credits

## Built With

* [Figma](https://figma.com)
* [Make](https://www.gnu.org/software/make/)
* [NPM](https://github.com/npm)
* [Vite](https://vitejs.dev/) and [Vitest](https://vitest.dev/) 
* [Lucide](https://lucide.dev/)
* [Tailwind](https://tailwindcss.com/)
* [Typescript](https://www.typescriptlang.org/)
* [React](https://react.dev)
* [Visual Studio Code](https://code.visualstudio.com/)

## Versioning

TBD 

<!-- We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). -->

## Authors

**ESnet - Measurement and Analytics Group for Berkeley Lab** - *Initial work* 
- [ESnet](https://es.net)
- [Berkeley Lab](https://lbl.gov)

See also the list of [maintainers](https://gitlab.es.net/seg/terranova/-/project_members) who participated in this project.

## License

TBD