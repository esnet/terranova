# Code Style

Terranova enforces consistent code style via pre-commit hooks.

## Setup

Install pre-commit hooks after cloning:

```sh
source .venv/bin/activate
pre-commit install
```

Once installed, the hooks run automatically on `git commit`. To run them manually:

```sh
pre-commit run --all-files
```

## Python

**Formatter:** [Black](https://black.readthedocs.io/) (v22.3.0)

Black reformats Python code with no configuration — just run it:

```sh
.venv/bin/black .
```

**Linter:** [flake8](https://flake8.pycqa.org/) (v3.9.2) via [pyproject-flake8](https://pypi.org/project/pyproject-flake8/)

Flake8 configuration is in `pyproject.toml`. Run it with:

```sh
.venv/bin/pflake8 .
```

## Frontend (TypeScript / JavaScript)

**Formatter:** [Prettier](https://prettier.io/) (v2.4.1)

Prettier configuration is in `.prettierrc`. Files excluded from formatting are listed in `.prettierignore`.

Run Prettier manually:

```sh
cd terranova/frontend
pnpm exec prettier --write .
```

## Editor configuration

Most editors support Black and Prettier natively via extensions. Configure your editor to format on save using the project's formatter settings for the best experience.

- **VS Code**: Install the `ms-python.black-formatter` and `esbenp.prettier-vscode` extensions
- **JetBrains IDEs**: Black and Prettier are supported via the built-in external tools configuration
