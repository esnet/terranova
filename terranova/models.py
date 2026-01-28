from typing import Dict, List, Any, Optional
from fastapi import Query
from pydantic import BaseModel, Field, field_validator
from typing import Annotated

from enum import Enum
from dataclasses import make_dataclass, dataclass
from datetime import datetime
from terranova.abstract_models import QueryFilter

from terranova.settings import TOKEN_SCOPES


# Some Exceptions
class TerranovaNotFoundException(Exception):
    pass


# Pydantic Models for data output
class QueryResult(BaseModel):
    count: int
    data: List


class Tag(BaseModel):
    id: str
    name: str  # TODO: How, specifically do these relate to other models?
    # We had outlined this tentatively as being like a `git` tag;
    # pointing to a particular hash/ID. Is that how we'd like to proceed?
    # if so, we'll need this field:
    # id = str
    # given a flat table structure, all items (pipelines, mergerules, deletionrules, overriderules)
    # will have a unique ES-assigned ID. This should be all we need to
    # record one tag --> one object relationship.


class LayerConfiguration(BaseModel):
    # display options
    visible: bool
    name: str
    color: str
    edgeWidth: float
    pathOffset: float
    nodeWidth: float

    # "where's my topology" settings
    jsonFromUrl: bool
    mapjson: str | None = None
    mapjsonUrl: str | None = None

    # "data match" settings
    endpointId: str
    inboundValueField: str | None = None
    outboundValueField: str | None = None
    srcField: str | None = None
    dstField: str | None = None

    # what do these even do?
    legend: bool | None = None
    nodeHighlight: str | None = None


class ViewportCenter(BaseModel):
    lat: float
    lng: float


class Viewport(BaseModel):
    center: Optional[ViewportCenter] = None
    top: Optional[float] = None
    left: Optional[float] = None
    bottom: Optional[float] = None
    right: Optional[float] = None
    zoom: Optional[float] = None


class TilesetConfiguration(BaseModel):
    geographic: str | None = None
    boundaries: Optional[str] = None
    labels: Optional[str] = None


class MapConfiguration(BaseModel):
    # viewport strategy options
    initialViewStrategy: str
    latitudeVar: str | None = None
    longitudeVar: str | None = None

    viewport: Viewport
    background: str
    tileset: TilesetConfiguration

    # TODO: this probably shouldn't be represented
    editMode: bool

    # UI visibility options
    showSidebar: bool
    showViewControls: bool
    showLegend: bool

    # legend options
    legendColumnLength: int | None = None
    legendPosition: str | None = None
    legendDefaultBehavior: str | None = None

    # optional UI effects
    enableScrolling: bool

    # probably shouldn't be represented; always false?
    enableEditing: bool
    enableNodeAnimation: bool
    enableEdgeAnimation: bool

    # edge coloration thresholds
    thresholds: List[Any] | None = None  # TODO: Confirm this
    zIndexBase: int

    layers: List[LayerConfiguration]


class OverrideType(str, Enum):
    delete = "delete"
    add = "add"
    override = "override"


class OverrideRule(BaseModel):
    operation: OverrideType
    state: Dict | None = None
    render: bool | None = None

    @field_validator("state", mode="after")
    @classmethod
    def validate_state(cls, v, info):
        oper = info.data.get("operation")
        if oper != OverrideType.delete and not v:
            raise ValueError("state cannot be empty unless operation is delete")
        return v


class MapOverrides(BaseModel):
    nodes: Dict[str, OverrideRule]
    edges: Dict[str, OverrideRule]


class Map(BaseModel):
    # this will be a 7 character alphanumeric string
    mapId: str
    name: str
    version: int
    overrides: Dict[str, MapOverrides]  # DatasetID => Overrides
    configuration: MapConfiguration
    # this represents both the "owner" and "last editor" of this particular version/topology
    lastUpdatedBy: str
    lastUpdatedOn: datetime
    public: bool | None = None


class MapRevision(BaseModel):
    name: str
    overrides: Dict[str, MapOverrides]
    configuration: MapConfiguration


class DatasetQuery(BaseModel):
    endpoint: str
    filters: Annotated[List[QueryFilter], Field(min_length=0)]
    node_deduplication_field: str | None = "location_name"
    node_group_criteria: List[str] | None = None
    node_group_layout: str | None = None


class Dataset(BaseModel):
    datasetId: str  # 7-char alphanumeric string
    name: str
    version: int
    lastUpdatedBy: str  # both the "owner" and "last editor"
    lastUpdatedOn: datetime
    query: DatasetQuery
    results: List[Any] | None = None  # only set for Datasets with valid query filters
    # this will grant e.g. read and write privs to a particular group (Keycloak Workgroup)
    # group: str


class DatasetRevision(BaseModel):
    name: str
    query: DatasetQuery


class UserDataRevision(BaseModel):
    favorites: Dict[str, List[str]]
    lastEdited: Dict[str, List[str]]


class UserData(UserDataRevision):
    username: str


class Template(BaseModel):
    # this will be a 7 character alphanumeric string
    templateId: str
    name: str
    version: int
    # this represents both the "owner" and "last editor" of this particular version/topology
    lastUpdatedBy: str
    lastUpdatedOn: datetime
    # this will be an API URL or local part
    template: str
    # this will grant e.g. read and write privs to a particular group (Keycloak Workgroup)
    # group: str

    # class Config:
    #     allow_population_by_field_name = True


class ScopeEnum(str, Enum):
    read = TOKEN_SCOPES["read"]
    write = TOKEN_SCOPES["write"]
    publish = TOKEN_SCOPES["publish"]
    admin = TOKEN_SCOPES["admin"]


class NewTemplate(BaseModel):
    name: str
    template: str


class UserUpdate(BaseModel):
    username: str
    name: str
    scope: List[ScopeEnum]


class UserCreate(UserUpdate):
    password: str


class PasswordReset(BaseModel):
    password: str


MapFieldEnum = Enum("MapFieldEnum", {k: k for k in Map.model_fields.keys()})
DatasetFieldEnum = Enum("DatasetFieldEnum", {k: k for k in Dataset.model_fields.keys()})

# For specifying versions, we want to limit to specifiying an integer representing an
# individual version. Alternatively they can specify the special string "all" for getting
# all versions, or the special string "latest" for getting the numerically highest
# version of something
VersionEnum = Enum("VersionEnum", {"all": "all", "latest": "latest"})

TerranovaVersion = make_dataclass(
    "TerranovaVersion",
    [
        (
            "version",
            VersionEnum | int,
            Query(
                "latest",
                description="<i>Available values</i> : "
                "'all' for all versions, "
                "'latest' for latest, "
                "or an integer for a specific version",
            ),
        )
    ],
    namespace={
        "__str__": lambda self: str(self.version.name)
        if type(self.version) is VersionEnum
        else str(self.version)
    },
)


TemplateFieldEnum = Enum("TemplateFieldEnum", {k: k for k in Template.model_fields.keys()})


@dataclass
class TemplateFilters:
    templateId: List[str] = Query([])
    name: List[str] = Query([])
    lastUpdatedBy: List[str] = Query([])

    def items(self):
        for k, v in self.__dict__.items():
            if type(v).__name__ == "Query":
                yield (k, v.default)
            else:
                yield (k, v)


@dataclass
class MapFilters:
    mapId: List[str] = Query([])
    name: List[str] = Query([])
    lastUpdatedBy: List[str] = Query([])
    public: bool | None = Query(None)

    def items(self):
        for k, v in self.__dict__.items():
            if type(v).__name__ == "Query":
                yield (k, v.default)
            else:
                yield (k, v)


@dataclass
class PublicMapFilters:
    mapId: List[str] = Query([])
    name: List[str] = Query([])
    lastUpdatedBy: List[str] = Query([])

    def __post_init__(self):
        self.__dict__["public"] = True

    def items(self):
        for k, v in self.__dict__.items():
            if type(v).__name__ == "Query":
                yield (k, v.default)
            else:
                yield (k, v)


@dataclass
class DatasetFilters:
    datasetId: List[str] = Query([])
    name: List[str] = Query([])
    lastUpdatedBy: List[str] = Query([])

    def items(self):
        for k, v in self.__dict__.items():
            if type(v).__name__ == "Query":
                yield (k, v.default)
            else:
                yield (k, v)
