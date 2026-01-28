from pydantic import BaseModel, Field
from typing import Annotated
from enum import Enum
from typing import List, Union, Dict, Any
from dataclasses import make_dataclass, asdict
from fastapi import Query, HTTPException
from sqlalchemy import func, text, column, exists, and_, or_
from sqlalchemy.orm import Query as SQLQuery
from abc import ABC, abstractmethod
from terranova.logging import logger
from collections import defaultdict
import pygraphviz
from terranova.request import get_request
from contextvars import ContextVar
import orjson as json


# Used for Queries both at the API definition and at the Dataset storage level
class InputModifier(str, Enum):
    not_like = "not_like"
    like = "like"
    not_equal = "not_equal"
    equal = ""


class QueryFilter(BaseModel):
    field: str
    operator: InputModifier | None = None
    value: List[str]
    templated: bool | None = False


# For specifying output layout types, we can specify logical or geographic
class TerranovaLayout(Enum):
    geographic = "geographic"
    logical = "logical"


# As well as snapshot or dynamic
class TerranovaDatatype(Enum):
    live = "live"
    snapshot = "snapshot"


class TerranovaOutputType(Enum):
    json = "json"
    svg = "svg"


LatLon = Annotated[List[float], Field(min_length=2, max_length=2)]


class TopologyNodes(BaseModel):
    name: str
    coordinate: LatLon
    meta: Dict[str, Any]
    children: List[str] | None = None


class EdgeMeta(BaseModel):
    capacity: int | None = None
    endpoint_identifiers: Dict[str, List[Any]]


class TopologyEdges(BaseModel):
    name: str
    coordinates: Annotated[List[LatLon], Field(min_length=2)]
    meta: EdgeMeta


class Topology(BaseModel):
    nodes: List[TopologyNodes]
    edges: List[TopologyEdges]
    layer: str = "tail"
    name: str
    pathLayout: Dict[str, Any]


class BaseDatasource(ABC):
    @abstractmethod
    def query(self, filters, limit):
        pass

    @abstractmethod
    def render_topology(self, dataset, path_layout, use_snapshot, node_template):
        pass

    @abstractmethod
    def apply_layout(self, layout: TerranovaLayout, topology: Topology) -> Topology:
        pass


class SQLiteCacheDatasource(BaseDatasource):
    # this is the recommended decorator combination for "abstract property"
    @property
    @abstractmethod
    def record_model(self):
        pass

    @property
    @abstractmethod
    def table_model(self):
        pass

    @property
    @abstractmethod
    def json_column(self):
        pass

    def apply_filters(
        self, query: SQLQuery, filters: list[QueryFilter], apply_templated_filters=True
    ) -> SQLQuery:
        for filter in filters:
            field = filter.field
            operator = filter.operator
            value = filter.value
            templated = filter.templated
            request = get_request()
            if templated:
                if not apply_templated_filters:
                    continue
                if field not in request.query_params:
                    raise HTTPException(
                        status_code=400,
                        detail="Malformed request. Expected '?%s=' in query parameters." % field,
                    )
                value = request.query_params.getlist(field)

            if value == []:
                continue

            # print(f"{filter=} {operator=} {value=}")

            NOT = operator == InputModifier.not_equal
            NLIKE = operator == InputModifier.not_like
            LIKE = operator == InputModifier.like

            if LIKE or NLIKE:
                # Add SQL search tokens around each value
                value = ["%" + v + "%" for v in value]

            LOGIC = or_
            if NOT or NLIKE:
                LOGIC = and_

            COMPARATOR = "="
            if NOT:
                COMPARATOR = "!="
            if LIKE:
                COMPARATOR = "like"
            if NLIKE:
                COMPARATOR = "not like"

            exceptional_fields = group_fields_by_type(self.record_model)
            # Hack to work with JSON schema
            # TODO: this sort of hack appears in a few places, could this be
            # abstracted away into a class / model?
            # ie endpoints.location_name => we really care about the "location_name" inside
            # of the endpoints array objects
            if field in exceptional_fields["object_array"]:
                parent = exceptional_fields["object_array"][field]
                prefix = "%s_" % parent
                json_selector = "$.%s" % parent
                # if field.startswith("endpoints_"):
                filter_fieldname = field.split(prefix)[1]
                # When we're dealing with the array of endpoints, we're always doing
                # a positive match on the inner criteria
                LOCAL_COMPARATOR = "="
                if LIKE:
                    LOCAL_COMPARATOR = "like"

                # Similar to the above, when we're dealing with an array we're default to
                # AND since we want everything in the array to match, unless we're in a
                # negation context in which we want any of the matches to disqualify
                LOCAL_LOGIC = and_
                if NOT or NLIKE:
                    LOCAL_LOGIC = or_

                filter = LOCAL_LOGIC(
                    exists()
                    .select_from(
                        func.json_each(func.json_extract(self.json_column, json_selector))
                    )
                    .where(
                        func.json_extract(text("value"), f"$.{filter_fieldname}").op(
                            LOCAL_COMPARATOR
                        )(v)
                    )
                    for v in value
                )

                # If we're then in a negation context, we can negate the entire match
                # ie if I want to skip any circuits that have an endpoint with
                # type = "Organization" I want to generate
                # "NOT any endpoint.type == Organization"
                # vs
                # "any endpoint_type != Organization"
                if NOT or NLIKE:
                    query = query.filter(~filter)
                else:
                    query = query.filter(filter)

            elif field in exceptional_fields["child_model"]:
                parent = exceptional_fields["child_model"][field]
                prefix = "%s_" % parent
                child = field.split(prefix)[1]

                query = query.filter(
                    LOGIC(
                        func.json_extract(self.json_column, f"$.{parent}.{child}").op(COMPARATOR)(
                            v
                        )
                        for v in value
                    )
                )

            # Also hack to work with JSON schemas. These are array fields so need to be unwound
            elif field in exceptional_fields["string_array"]:
                # elif "tags" in field:
                query = query.filter(
                    exists()
                    .select_from(func.json_each(func.json_extract(self.json_column, f"$.{field}")))
                    .where(LOGIC(column("value").op(COMPARATOR)(v) for v in value))
                )

            # every other field type
            else:
                query = query.filter(
                    LOGIC(
                        func.json_extract(self.json_column, f"$.{field}").op(COMPARATOR)(v)
                        for v in value
                    )
                )

        logger.debug("Query after applying filters is %s", query)

        return query

    def _flatten(self, ls: Union[List, str]) -> List:
        if not isinstance(ls, list):
            return [ls]
        flat = []
        for item in ls:
            flat += self._flatten(item)
        return flat

    def apply_layout(self, layout: TerranovaLayout, topology: Topology, node_template):
        if layout in [TerranovaLayout.logical.value, TerranovaLayout.logical]:
            topology = self._apply_logical(topology, node_template)
        return topology

    def _apply_logical(self, topology, node_template):
        # The logical Topology is exactly the same as the geographic one, just with shifted
        # lat/lon values for all nodes and edges. Avoid a lot of code duplication.
        topology = topology.model_dump()
        # Step 1 - we need to build up a graphviz graph object so that we can compute
        # a layout
        G = pygraphviz.AGraph()

        # By default, try to plot left to right and ensure that all lines go to
        # the center of all the nodes. Since we aren't actually drawing the final
        # result using graphviz this ensure that the positions will touch in the
        # final topology
        G.graph_attr.update(rankdir="LR")
        G.edge_attr.update(headclip="false")
        G.edge_attr.update(tailclip="false")

        for edge in topology["edges"]:
            # This also implicitly adds the nodes
            endpoints = edge["meta"]["endpoint_identifiers"].get("names", [])
            G.add_edge(endpoints[0], endpoints[1])

        # Step 2 - let Graphviz do its layout magic. This assigns 'pos' attributes
        # to everything which we can reference later
        G.layout()

        # Grab the bounding box after the layout is finished. This is going to be
        # used to figure out how to recast all the coordinates into relative lat/lon.
        llx, lly, urx, ury = list(map(lambda x: float(x), G.graph_attr["bb"].split(",")))

        # Given an x,y position convert to relative lat/lon from the scoped Graph.
        MAX_LAT_BOUND = 30  # small number: avoid distortion on map projection
        MAX_LON_BOUND = 60  # set this to a corresponding small number

        def convert_xy_to_latlon(x, y):
            lat = MAX_LAT_BOUND * (float(y) / ury) - (MAX_LAT_BOUND / 2)
            lon = MAX_LON_BOUND * (float(x) / urx) - (MAX_LON_BOUND / 2)
            return (lat, lon)

        # Adjust position for nodes
        for node in topology["nodes"]:
            graphviz_pos = G.get_node(node["name"]).attr["pos"]
            x, y = graphviz_pos.split(",")
            node["coordinate"] = convert_xy_to_latlon(x, y)

        # Adjust position for edges
        for edge in topology["edges"]:
            endpoint_identifiers = edge["meta"]["endpoint_identifiers"]["names"]
            graphviz_pos = G.get_edge(endpoint_identifiers[0], endpoint_identifiers[1]).attr["pos"]

            # For some reason, we sometimes get duplicate concurrent coordinates which causing
            # issues with rendering, eg something like this -
            # 0 => (57.88364635822262, -119.7062937062937)
            # 1 => (57.88364635822262, -119.7062937062937)
            # 2 => (-1.2007558405863392, -66.42643894566972)
            # 3 => (-1.2007558405863392, -66.42643894566972)
            # We have to support circuits where start == end so we cannt simply unique
            # the endpoints.
            # Strategy is to test if this one is the same as the last one and if so, skip
            new_coordinates = []
            for i, coordinate_pair in enumerate(graphviz_pos.split(" ")):
                current = convert_xy_to_latlon(*coordinate_pair.split(","))
                if i and new_coordinates[-1] == current:
                    continue
                new_coordinates.append(current)

            edge["coordinates"] = new_coordinates

        return Topology(**topology)

    def get_unique_values(
        self, field: str, filters: Dict[str, List[str]] = {}, extra_criteria=[]
    ) -> List[str]:
        exceptional_fields = group_fields_by_type(self.record_model)

        parent_field_candidate = field.split("_")[0]
        # Working around JSON and/or developer limitations. endpoints
        # are a nested array
        if (
            field in exceptional_fields["object_array"]
            or parent_field_candidate in exceptional_fields["object_array_prefixes"]
        ):
            parent = exceptional_fields["object_array"].get(field, parent_field_candidate)
            prefix = "%s_" % parent
            json_selector = "$.%s" % parent
            fieldname = field.split(prefix)[1]
            query = (
                self.session.query(
                    func.json_extract(text("value"), f"$.{fieldname}").label("values")
                )
                .select_from(self.table_model, func.json_each(self.json_column, json_selector))
                .distinct()
                .filter(column("values") is not None)
                .filter(column("values") != "")
                .order_by("values")
            )

        elif field in exceptional_fields["child_model"]:
            parent = exceptional_fields["child_model"][field]
            prefix = "%s_" % parent
            fieldname = field.split(prefix)[1]
            query = (
                self.session.query(
                    func.json_extract(self.json_column, f"$.{parent}.{fieldname}").label("values")
                )
                .select_from(self.table_model)
                .distinct()
                .filter(column("values") is not None)
                .filter(column("values") != "")
                .order_by("values")
            )

        else:
            query = (
                self.session.query(self.json_column[field])
                .distinct()
                .filter(self.json_column.op("->")(field) is not None)
                .order_by(self.json_column[field])
            )

        # extra_criteria is a list of
        # filters to be applied to the query before doing
        # 'normal' field filtering
        for flt in extra_criteria:
            query = query.filter_by(**flt)

        query = self.apply_filters(query, filters)

        rows = query.all()
        rows = list(
            map(
                lambda x: x[0] if (not x[0] or not x[0][0] in ["{", "["]) else json.loads(x[0]),
                rows,
            )
        )

        # This is a bit ugly. SQLite3 doesn't seem to support the concept
        # of an array datatype or functions around it, so we have to
        # do this part ourselves. Ensure that we're flattening
        # out the responses
        uniq = {}
        flattened = self._flatten(rows)
        for item in flattened:
            if item:
                uniq[item] = 1
        return sorted(list(uniq.keys()))


class BaseTypeFilters:
    pass


def group_fields_by_type(model_class):
    schema = model_class.model_json_schema()
    properties = schema["properties"]
    definitions = schema.get("$defs", {})
    fields = defaultdict(dict)
    for field_name, field in properties.items():
        if field.get("type") == "array" and field.get("items", {}).get("type") == "string":
            fields["string_array"][field_name] = field_name
            for modifier in InputModifier:
                modified_field_name = "%s_%s" % (field_name, modifier.name)
                fields["string_array"][modified_field_name] = field_name
        elif field.get("type") == "array" and field.get("items", {}).get("$ref"):
            type_name = field.get("items", {}).get("$ref").split("/")[-1]
            sub_schema = definitions[type_name]["properties"]
            for child_field in sub_schema:
                child_field = "%s_%s" % (field_name, child_field)
                fields["object_array"][child_field] = field_name
                fields["object_array_prefixes"][field_name] = field_name
                for modifier in InputModifier:
                    modified_child_field = "%s_%s" % (child_field, modifier.name)
                    fields["object_array"][modified_child_field] = field_name
        elif not field.get("type") and field.get("$ref"):
            type_name = field.get("$ref").split("/")[-1]
            sub_schema = definitions[type_name]["properties"]
            for child_field in sub_schema:
                child_field = "%s_%s" % (field_name, child_field)
                fields["child_model"][child_field] = field_name
                for modifier in InputModifier:
                    modified_child_field = "%s_%s" % (child_field, modifier.name)
                    fields["child_model"][modified_child_field] = field_name
    return fields


def enumerate_fields(schema, definitions, prefix=""):
    output = []
    for field_name, field in schema.items():
        if field.get("type") == "array" and field.get("items", {}).get("$ref"):
            type_name = field.get("items", {}).get("$ref").split("/")[-1]
            output += enumerate_fields(
                definitions[type_name]["properties"], definitions, field_name
            )
        elif field.get("$ref"):
            type_name = field.get("$ref").split("/")[-1]
            output += enumerate_fields(
                definitions[type_name]["properties"], definitions, field_name
            )
        else:
            output.append(prefix + "_" + field_name if prefix else field_name)
    return output


def enumerate_filterable_columns(model_class):
    schema = model_class.model_json_schema()
    properties = schema["properties"]
    definitions = schema.get("$defs", {})
    filterable_fields = enumerate_fields(properties, definitions)
    return {f: f for f in filterable_fields}


def flatten_field(name, field, prefix=""):
    output = []
    if prefix:
        name = "%s_%s" % (prefix, name)

    # In Pydantic v2, nullable fields might use anyOf instead of direct type
    field_type = field.get("type")
    if not field_type and "anyOf" in field:
        # Extract type from anyOf (skip null type)
        for schema_option in field["anyOf"]:
            if schema_option.get("type") and schema_option["type"] != "null":
                field_type = schema_option["type"]
                break

    if field_type == "string":
        signature = List[str]
        output.append((name, signature, Query([])))
        for modifier in InputModifier:
            output.append(("%s_%s" % (name, modifier.name), signature, Query([])))
    if field_type == "integer":
        signature = List[int]
        output.append((name, signature, Query([])))
    return output


def flatten_fields(schema, definitions, prefix=""):
    output = []
    for field_name, field in schema.items():
        if field.get("type") == "array":
            local_prefix = field_name
            # a field like this is an array of strings. Pretty much the same as the string type
            if field["items"].get("type") == "string":
                output += flatten_field(field_name, field["items"], prefix)
            # a field like this is an array of objects. Recurse.
            elif field["items"].get("$ref"):
                type_name = field["items"].get("$ref").split("/")[-1]
                sub_schema = definitions[type_name]
                output += flatten_fields(
                    sub_schema["properties"],
                    definitions,
                    "_".join([prefix, local_prefix]) if prefix else local_prefix,
                )
        elif field.get("$ref"):
            local_prefix = field_name
            type_name = field.get("$ref").split("/")[-1]
            sub_schema = definitions[type_name]
            output += flatten_fields(
                sub_schema["properties"],
                definitions,
                "_".join([prefix, local_prefix]) if prefix else local_prefix,
            )
        else:
            output += flatten_field(field_name, field, prefix)
    return output


_all_filterable_fields: ContextVar[str] = ContextVar("all_filterable_fields", default=[])


def get_all_type_filters():
    all_fields = {}
    # deduplicate all fields by name
    for field in _all_filterable_fields.get():
        all_fields[field[0]] = field
    return make_dataclass(
        "TypeFilters", [f for f in all_fields.values()], bases=(BaseTypeFilters,)
    )


def create_type_filters(model_class, backend):

    schema = model_class.model_json_schema()
    properties = schema["properties"]
    definitions = schema.get("$defs", {})
    filterable_fields = flatten_fields(properties, definitions)
    curval = _all_filterable_fields.get()
    _all_filterable_fields.set(curval + filterable_fields)

    # Helper function to make it more transparent to things outside of this class
    # what the inputs and their intents were. Translates things like "circuit_name_not"
    # into "circuit_name" with the modifier of "not_equal".
    def _decode_field(field_name):
        operator = None

        for modifier in InputModifier:
            if not field_name.endswith("_" + modifier.name):
                continue
            field_name = field_name.replace("_" + modifier.name, "")
            operator = modifier

        return (field_name, operator)

    def _validate_types_exist(self):
        # This is lazy but makes for more simple code later
        for field_name, values in asdict(self).items():
            if len(values) == 0:
                continue

            # Check to see if this is a `like` modifier, which we
            # don't need to verify
            field_name, operator = _decode_field(field_name)
            if operator in [InputModifier.like, InputModifier.not_like]:
                continue

            possible_vals = None
            for value in values:
                # minor local caching if multiple values for this field,
                # no need to get unique vals more than once
                if possible_vals is None:
                    possible_vals = backend.get_unique_values(field_name)

                if value not in possible_vals:
                    raise HTTPException(
                        detail="Value must be one of %s" % possible_vals, status_code=400
                    )

    # Allow casting to a list easily
    def _input_to_list(self):
        for field_name, values in asdict(self).items():
            field_name, operator = _decode_field(field_name)
            yield QueryFilter(field=field_name, operator=operator, value=values)

    return make_dataclass(
        "TypeFilters",
        filterable_fields,
        bases=(BaseTypeFilters,),
        namespace={"__post_init__": _validate_types_exist, "__iter__": _input_to_list},
    )
