"""
Storage backend factory module.

This module provides a unified interface to access the configured storage backend
(either Elasticsearch or SQLite) based on the application configuration.
"""

from terranova.settings import STORAGE_BACKEND, SQLITE_DB_PATH


def get_storage_backend():
    """
    Factory function that returns the appropriate storage backend instance
    based on the configuration.

    Returns:
        ElasticSearchBackend or SQLiteBackend: The configured storage backend instance

    Raises:
        ValueError: If an invalid storage backend is configured
    """
    if STORAGE_BACKEND == "elasticsearch":
        from terranova.backends.elasticsearch import backend
        return backend
    elif STORAGE_BACKEND == "sqlite":
        from terranova.backends.sqlite import SQLiteBackend
        # Create a singleton instance with configured path
        if not hasattr(get_storage_backend, '_sqlite_instance'):
            get_storage_backend._sqlite_instance = SQLiteBackend(db_path=SQLITE_DB_PATH)
        return get_storage_backend._sqlite_instance
    else:
        raise ValueError(
            f"Invalid storage backend '{STORAGE_BACKEND}'. "
            f"Must be either 'elasticsearch' or 'sqlite'"
        )


# Export a singleton instance for backwards compatibility
backend = get_storage_backend()
