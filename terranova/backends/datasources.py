from terranova import datasources as datasources_module
import pkgutil
import inspect
import importlib
from pydantic import BaseModel
from enum import Enum
from typing import Union
from terranova.abstract_models import BaseTypeFilters, BaseDatasource


class DummyDatasource(BaseDatasource):
    def __init__(self, name):
        self.name = name

    def query(self, filters, limit=None):
        raise Exception("Datasource named '%s' not found." % self.name)


class DatasourceRegistry(dict):
    def get(self, name):
        return super().get(name, DummyDatasource(name))

    def discover(self):
        for importer, name, is_pkg in pkgutil.iter_modules(
            path=datasources_module.__path__, prefix=datasources_module.__name__ + "."
        ):
            name_lookup = name.split(".")[-1]
            module = importlib.import_module(name)

            # test that assertions are here for a given plugin

            # called to cache records for the plugin
            assert getattr(module, "fetch")
            # provides FastAPI router to be tied into URL space
            assert getattr(module, "router")
            # provides a backend object that does data retrieval
            assert getattr(module, "backend")
            # ensure that backend knows how to render a topology
            assert getattr(module.backend, "render_topology")
            # usually called in __init__ itself to configure settings
            assert getattr(module, "configure")
            # provided to the frontend to describe data and filtration UI options
            assert getattr(module, "metadata")

            self[name_lookup] = module


datasources = DatasourceRegistry()
datasources.discover()


class NamedDatasource(BaseModel):
    name: Enum("Datasources", {k: k for k, v in datasources.items()})


filter_subtypes = []
for name, source in datasources.items():
    for name, cls in inspect.getmembers(source.models):
        if (
            inspect.isclass(cls)
            and issubclass(cls, BaseTypeFilters)
            and cls is not BaseTypeFilters
        ):
            filter_subtypes.append(cls)

FilterTypes = Union[tuple(filter_subtypes)]
