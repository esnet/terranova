from glob import glob

# Load everything in fixtures/*.py as a "fixture" for pytest, this makes them available in each
# test without doing any additional work
pytest_plugins = [
    fixture.replace("/", ".").replace(".py", "") for fixture in glob("tests/fixtures/*.py")
]
