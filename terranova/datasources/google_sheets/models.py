from typing import List
from pydantic import BaseModel, ConfigDict

# don't import 'models' to avoid circular imports
from terranova.abstract_models import create_type_filters, enumerate_filterable_columns
from enum import Enum

from .backend import GoogleSheetsBackend


class Metadata(BaseModel):
    name: str
    value: List[str] | None


class Node(BaseModel):
    name: str
    latitude: float
    longitude: float
    description: str | None

    model_config = ConfigDict(extra="allow")


class Edge(BaseModel):
    id: str
    name: str
    description: str | None
    endpoints: List[Node]
    source: str
    destination: str

    model_config = ConfigDict(extra="allow")


class GoogleSheet(BaseModel):
    id: str
    name: str


TypeFilters = create_type_filters(Edge, backend=GoogleSheetsBackend())

FilterableColumn = Enum("FilterableColumn", enumerate_filterable_columns(Edge))
