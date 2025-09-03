# Terranova API: Rough Guidance Document

This document is intended to guide the development of the TN API, providing a rough specification that
helps developers create the intended set of functionality. It's a work-in-progress and specifics
details may differ to some degree.

# API Endpoints

## Root Endpoint

When a user arrives at the root of our API,
send a list of the child endpoints

`GET /`

## Output

These endpoints vend a rendered copy
(a copy where the query output and overrides are merged)
of a layer.

### Layer output

**Live Layer output**

`GET /output/layer/{layer_name}`
vends the rendered output of the live query for {layer_name}

**Snapshot Layer output**

`GET /output/layer/{layer_name}/snapshot/{snapshot_id}`
vends the rendered output of a specific snapshot of {layer_name}

### Map output

`GET /output/map/{map_name}/topology`
vends the full rendered topology of a finished map topology.

`GET /output/map/{map_name}/options`
vends the rendered options of a finished map topology.

**Future work**
`GET /output/map/{map_name}/iframe`
This is a theoretical/proposed/later use case. We could maybe vend the rendered output of a finished map topology.
We could use this as an iframe. This would require being able to configure the data layer and the full set of display options.
Let's do this in 2.0 maybe.

## Circuits

Slice and dice ESDB circuits.

`GET /circuits`
See Swagger spec for specifics about how to retrieve specific circuits and their values

## Layers

Map Layers. These encapsulate two things:

1. A query
2. A set of overrides

`GET /layers`
get list of all topologies (offset: default 0, limit: default 10)

`POST /layer`
create a new layer

<!-- Implement later -->
`POST /layer/tag/`
create new layer tag

`GET /layer/id/{id}`
specific layer by ID (always single record)

`PUT /layer/id/{id}`
update a specific layer by ID

## Maps

A full map. These have a list of Layer Configurations.
Each Layer Configuration contains:

1. The URL of the snapshot or pipeline to get layer information from
2. The name of the layer
3. Styling information for the layer

`GET /maps`
get a list of all maps (offset: default 0, limit: default 10)

`POST /map`
create a new map

<!-- Implement later -->
`GET /maps?field=id`
get a list of map id's

<!-- Implement later -->
`GET /map/tag/`
list of map tags

<!-- Implement later -->
`POST /map/tag/`
create new map tag

`GET /map/id/{id}`
specific map by ID (always single record)

`PUT /map/id/{id}`
update a specific map by ID

# API Options

## GET options

GET options will apply to all endpoints. They describe general
data operations such as sort, offset/limit, filtration.

`?sort=fieldName`
sort results by fieldName asc (default timestamp)

`?sort=-fieldName`
sort results by fieldName desc

`?field=fieldName`
retrieve a specific field from each result

`?offset=N`
retrieve results from result N onward (default 0)

`?limit=N`
retrieve no more than N results (after offset)

`?{field}={value}`
consult schema for datatype. if `field` in `datatype`.
if {field} not in schema, ValueError I think?
