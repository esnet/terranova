from fastapi import APIRouter, Request, Depends, HTTPException, Response, Security
from terranova.settings import TOKEN_SCOPES
from fastapi_versioning import version
from terranova.backends.auth import User, auth_check
from terranova.backends.storage import backend as storage_backend
from terranova.backends.datasources import datasources, NamedDatasource, FilterTypes
from terranova.logging import logger
from typing import List, Dict, Any
from terranova.abstract_models import get_all_type_filters
import re
import orjson as json
from terranova.output.svg import render_svg, render_map_svg
from terranova.api.routers.datasets import parse_dataset_endpoint

from terranova.abstract_models import (
    TerranovaOutputType,
    TerranovaLayout,
    TerranovaDatatype,
    Topology,
)
from terranova.models import (
    Dataset,
    Template,
    DatasetQuery,
    DatasetRevision,
    TerranovaVersion,
    Map,
    MapRevision,
    MapOverrides,
    OverrideType,
    LayerConfiguration,
)

from terranova.settings import DEFAULT_NODE_TEMPLATES
import datetime

router = APIRouter(tags=["Terranova Output"])

TypeFilters = get_all_type_filters()


@router.get(
    "/output/dataset/{dataset_id}/{layout}/{datatype}/{output_type}/",
    summary="Get the output from dataset with dataset_id, given a layout and datatype, \
optionally selecting an output_type and version",
)
@version(1)
def dataset_output(
    dataset_id: str,
    layout: TerranovaLayout,
    datatype: TerranovaDatatype,
    output_type: TerranovaOutputType | None = None,
    template: str | None = None,
    version: TerranovaVersion = Depends(),
    filters: TypeFilters = Depends(),
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["read"]]),
):
    if output_type is None:
        output_type = TerranovaOutputType.json

    use_snapshot = datatype == TerranovaDatatype.snapshot

    dataset_json = storage_backend.get_datasets(dataset_id=dataset_id, version=version)
    if len(dataset_json) < 1:
        version_suffix = f" and version = {version}" if version is not None else ""
        raise HTTPException(
            status_code=404,
            detail=f"No dataset found with dataset_id = {dataset_id}{version_suffix}",
        )

    # by default, results are ordered by lastEditedOn desc.
    dataset = Dataset(**dataset_json[0])

    # does this check need to exist? This feels like a decent safeguard but
    # should be an impossible scenario?
    if use_snapshot and not dataset.results:
        dataset_clause = f" with dataset_id={dataset_id}"
        version_clause = f" and version = {version}" if version is not None else ""
        raise HTTPException(
            status_code=404,
            detail=f"Dataset{dataset_clause}{version_clause} has no snapshot data",
        )

    endpoint, context = parse_dataset_endpoint(dataset.query.endpoint)

    path_layout = {"type": "curveCardinal", "tension": 0.6}
    if layout in [TerranovaLayout.logical, "logical"]:
        path_layout = {"type": "curveLinear", "tension": 0.6}
    node_template = _get_template(
        template_id=template, geographic=layout in [TerranovaLayout.geographic, "geographic"]
    )

    topology = datasources[endpoint].backend.render_topology(
        dataset,
        path_layout=path_layout,
        use_snapshot=use_snapshot,
        node_template=node_template,
        **context,
    )

    topology = datasources[endpoint].backend.apply_layout(layout, topology, node_template)

    if output_type == TerranovaOutputType.svg:
        return Response(render_svg(topology), media_type="image/svg+xml")
    return topology


# Outputs a dataset directly from a query, only supports live view.
@router.patch(
    "/output/query/raw/",
    summary="Receives a Dataset Revision via PATCH; outputs raw query results",
)
@version(1)
def output_dataset_revision_raw(
    request: Request,
    dataset_revision: DatasetRevision,
    filters: TypeFilters = Depends(),
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["write"]]),
) -> List[Dict[Any, Any]]:
    dataset = _make_ephemeral_dataset(dataset_revision.query)
    endpoint, context = parse_dataset_endpoint(dataset.query.endpoint)
    response = datasources[endpoint].backend.query(dataset.query.filters, limit=None, **context)
    return response.data


# Outputs a dataset directly from a query, only supports live view.
@router.patch(
    "/output/query/{layout}/",
    summary="Receives a Dataset Revision via PATCH; outputs live topology data",
)
@version(1)
def output_dataset_revision(
    dataset_revision: DatasetRevision,
    layout: TerranovaLayout,
    filters: TypeFilters = Depends(),
    template: str | None = None,
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["write"]]),
) -> Topology:
    dataset = _make_ephemeral_dataset(dataset_revision.query)

    path_layout = {"type": "curveCardinal", "tension": 0.6}
    if layout in [TerranovaLayout.logical, "logical"]:
        path_layout = {"type": "curveLinear", "tension": 0.6}

    template = _get_template(
        template_id=template, geographic=layout in [TerranovaLayout.geographic, "geographic"]
    )

    endpoint, context = parse_dataset_endpoint(dataset.query.endpoint)

    topology = datasources[endpoint].backend.render_topology(
        dataset, path_layout=path_layout, use_snapshot=False, node_template=template, **context
    )

    return datasources[endpoint].backend.apply_layout(layout, topology, template)


# Outputs a dataset directly from a query, only supports live view.
@router.get(
    "/output/query/{layout}/",
    summary="Creates a query via GET variables; outputs live topology data",
)
@version(1)
def output_dataset_query(
    layout: TerranovaLayout,
    datasource: NamedDatasource,
    template: str | None = None,
    filters: FilterTypes = Depends(),
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["write"]]),
) -> Topology:
    datasetquery = DatasetQuery(endpoint=datasource, filters=list(filters))

    dataset = _make_ephemeral_dataset(datasetquery)

    path_layout = {"type": "curveCardinal", "tension": 0.6}
    if layout in [TerranovaLayout.logical, "logical"]:
        path_layout = {"type": "curveLinear", "tension": 0.6}
    template = _get_template(
        template_id=template, geographic=layout in [TerranovaLayout.geographic, "geographic"]
    )

    topology = datasources[dataset.endpoint].render_topology(
        dataset, path_layout=path_layout, node_template=template
    )
    return datasources[dataset.endpoint].backend.apply_layout(layout, topology)


@router.get("/output/map/{mapId}/{output_type}/", summary="Get Map output")
@version(1)
def get_map_output(
    mapId: str,
    request: Request,
    version: TerranovaVersion = Depends(),
    output_type: TerranovaOutputType | None = None,
    filters: TypeFilters = Depends(),
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["write"]]),
) -> Map:
    map_json = storage_backend.get_maps(map_id=mapId, version=version)
    if len(map_json) < 1:
        raise HTTPException(
            status_code=404,
            detail="No map found with id = %s and version = %s" % (mapId, version),
        )

    # by default, results are ordered by lastEditedOn desc.
    map_obj = Map(**map_json[0])
    _normalize_map(map_obj, user)
    if output_type == TerranovaOutputType.svg:
        return Response(
            render_map_svg(map_obj),
            media_type="image/svg+xml",
            headers={"Content-Disposition": f'inline; filename "{map_obj.name}.svg"'},
        )
    return map_obj


@router.get("/public/output/map/{mapId}/", summary="Get output for public map")
@version(1)
def output_public_map(
    mapId: str,
    request: Request,
    version: TerranovaVersion = Depends(),
    filters: TypeFilters = Depends(),
):
    map_json = storage_backend.get_public_maps(map_id=mapId, version=version)
    if len(map_json) < 1:
        raise HTTPException(
            status_code=404,
            detail="No map found with id = %s and version = %s" % (mapId, version),
        )

    # by default, results are ordered by lastEditedOn desc.
    map_obj = Map(**map_json[0])
    _normalize_map(map_obj)
    return map_obj.configuration


@router.get("/public/output/map/{mapId}/{output_type}/", summary="Get output for public map")
@version(1)
def output_typed_public_map(
    mapId: str,
    request: Request,
    version: TerranovaVersion = Depends(),
    output_type: TerranovaOutputType | None = None,
    filters: TypeFilters = Depends(),
):
    map_json = storage_backend.get_public_maps(map_id=mapId, version=version)
    if len(map_json) < 1:
        raise HTTPException(
            status_code=404,
            detail="No map found with id = %s and version = %s" % (mapId, version),
        )

    # by default, results are ordered by lastEditedOn desc.
    map_obj = Map(**map_json[0])
    _normalize_map(map_obj)
    if output_type == TerranovaOutputType.svg:
        return Response(
            render_map_svg(map_obj),
            media_type="image/svg+xml",
            headers={"Content-Disposition": f'inline; filename "{map_obj.name}.svg"'},
        )
    return map_obj


@router.patch("/output/map/", summary="Get output for in-progress Map")
@version(1)
def output_map_patch(
    map_revision: MapRevision,
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["write"]]),
) -> MapRevision:
    _normalize_map(map_revision, user)
    return map_revision


def _normalize_map(map_object: Map | MapRevision, user: User = None) -> None:
    map_layers = map_object.configuration.layers
    map_overrides = map_object.overrides

    # normalize json urls into the actual contents
    for layer in map_layers:
        query_url = layer.mapjsonUrl

        # TODO: this is a really bad way of sniffing whether
        # this is a terranova URL or not
        # Add the actual mapjson values from this dataset
        match = None
        if query_url:
            match = re.match(
                ".+/output/dataset/(?P<dataset_id>[A-z0-9]+)/(?P<layout>.+)/(?P<datatype>.+)/\??(?P<querystring>.*)",  # noqa
                query_url,
            )
        if match:
            match_data = match.groupdict()
            dataset_id = match_data.get("dataset_id")
            querystring = match_data.get("querystring")
            del match_data["querystring"]
            for pair in querystring.split("&"):
                k, v = pair.split("=")
                match_data[k] = v
            match_data["user"] = user
            topology_json = dataset_output(**match_data)
            layer.mapjson = topology_json.model_dump()

            override = map_overrides.get(dataset_id)
            if override:
                _apply_layer_overrides(layer, override)

            layer.mapjson = json.dumps(layer.mapjson)
        else:
            logger.warn("Unknown mapjsonurl, skipping - value was %s" % query_url)


def _get_template(template_id: str, geographic=True) -> str:
    if not template_id:
        if geographic:
            return DEFAULT_NODE_TEMPLATES["GEOGRAPHIC"]
        else:
            return DEFAULT_NODE_TEMPLATES["LOGICAL"]
    response = storage_backend.get_templates(template_id=template_id)
    if len(response) < 1:
        raise HTTPException(
            status_code=404, detail="Requested template with %s not found" % template_id
        )
    return Template(**response[0]).template


def _apply_layer_overrides(layer: LayerConfiguration, override: MapOverrides) -> None:
    logger.debug("Evaluating overrides on layer %s" % layer.name)

    topology = layer.mapjson

    _do_override(override.nodes, topology.get("nodes", []))
    _do_override(override.edges, topology.get("edges", []))

    layer.mapjson = topology


def _do_override(overrides, json_data):
    for identifier, override in overrides.items():
        if not override.render:
            continue
        # does the override for this identifier exist in this dataset?
        # if so, where?
        existing_index = next(
            (i for (i, d) in enumerate(json_data) if d["name"] == identifier), None
        )

        logger.debug(
            f"Doing override for {identifier=}, {override.operation=} and {existing_index=}"
        )

        # - A does not exist. A: override.type is "override"
        #     - add A, with "state" from override
        # - A does not exist. A: override.type is "add"
        #     - add A
        # - A does not exist. A: override.type is "delete"
        #     - no action
        # - A exists. A: override.type is "overrides"
        #     - completely replace A with "state" from override
        # - A exists. A: overrides.type is "add"
        #     - no action
        # - A exists. A: overrides.type is "delete"
        #     - delete A
        if existing_index is None and override.operation in (
            OverrideType.add,
            OverrideType.override,
        ):
            logger.debug("Choosing to add because not found")
            json_data.append(override.state)

        if existing_index is not None and override.operation == OverrideType.override:
            logger.debug("Choosing to override existing found")
            json_data[existing_index] = override.state

        if existing_index is not None and override.operation == OverrideType.delete:
            logger.debug("Choosing to delete existing found")
            del json_data[existing_index]


# Just a helper function to avoid repetition in cases where we're generating
# topologies from non datasets
def _make_ephemeral_dataset(query: DatasetQuery) -> Dataset:
    return Dataset(
        datasetId="ephemeral",
        name="ephemeral",
        version=1,
        lastUpdatedBy="n/a",
        lastUpdatedOn=datetime.datetime.now(),
        query=query,
    )
