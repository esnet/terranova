from typing import List
from pydantic import BaseModel, ConfigDict
from terranova.abstract_models import create_type_filters, enumerate_filterable_columns
from enum import Enum


class Node(BaseModel):
    name: str
    latitude: float
    longitude: float
    description: str | None = None
    model_config = ConfigDict(extra="allow")


class Edge(BaseModel):
    id: str
    name: str
    description: str | None = None
    endpoints: List[Node]
    source: str
    destination: str
    model_config = ConfigDict(extra="allow")


class CSVDataset(BaseModel):
    csv_id: str
    csv_name: str


def _make_type_filters():
    from .backend import CSVBackend
    return create_type_filters(Edge, backend=CSVBackend())


TypeFilters = _make_type_filters()

FilterableColumn = Enum("FilterableColumn", enumerate_filterable_columns(Edge))
