# Contributing

Thank you for considering contributing to Terranova! This section covers how to get set up for development and how to submit contributions.

## Ways to contribute

- **Bug reports** — open an [issue on GitHub](https://github.com/esnet/terranova/issues) with steps to reproduce
- **Feature requests** — open an issue describing the use case
- **Pull requests** — see the guides below for how to set up a development environment and submit code

## Development guides

| Guide | Description |
|---|---|
| [Development Setup](development-setup.md) | Set up your local dev environment |
| [Testing](testing.md) | Run the test suite |
| [Code Style](code-style.md) | Formatting and linting rules |
| [Project Structure](project-structure.md) | Directory layout explained |
| [Build Notes](build-notes.md) | Vite build and frontend build system notes |

## Pull request process

1. Fork the repository and create a branch from `main`
2. Make your changes, including tests for any new behavior
3. Ensure all tests pass (`make test`)
4. Ensure code style checks pass (`pre-commit run --all-files`)
5. Open a pull request against `main` with a clear description of the change
