import os
from setuptools import setup, find_packages

BUILD_ID = os.environ.get("BUILD_BUILDID", "0")

requirements = [
    "fastapi",
    "uvicorn[standard]",
    "requests",
    "elasticsearch",
    "fastapi_versioning",
    "sqlalchemy",
    "authlib",
    # "keycloak",
    # commented for now due to conflicting version of "h11".
    # Keycloak requires h11<0.13,>=0.11, but elsewhere we need >0.14
]
setup(
    name="terranova",
    version="0.1" + "." + BUILD_ID,
    # Author details
    author="James Kafader",
    author_email="jkafader@es.net",
    packages=find_packages("terranova"),
    entry_points={
        "console_scripts": [
            "cache-datasources=terranova.datacacher:main",
        ]
    },
    package_dir={
        "terranova": "terranova",
        "backends": "terranova/backends",
        "api": "terranova/api",
        "output": "terranova/output",
    },
    setup_requires=requirements,
    install_requires=requirements,
    extras_require={
        "tests": ["testcontainers-elasticsearch", "pytest", "httpx"],
    },
)
