from fastapi import APIRouter, Depends, HTTPException, Query, Security
from terranova.settings import TOKEN_SCOPES
from fastapi_versioning import version
from typing import List, Any

from terranova.backends.auth import User, auth_check
from terranova.backends.elasticsearch import backend as elastic_backend
from terranova.models import (
    Map,
    MapFilters,
    PublicMapFilters,
    MapFieldEnum,
    VersionEnum,
    MapRevision,
    TerranovaNotFoundException,
)

router = APIRouter(tags=["Terranova Maps"])


@router.get("/map/id/{mapId}/")
@version(1)
def map_by_id(mapId: str, user: User = Security(auth_check, scopes=[TOKEN_SCOPES["read"]])) -> Map:
    result = elastic_backend.get_maps(map_id=mapId)
    if len(result) < 1:
        raise HTTPException(status_code=404, detail="Map with id %s not found" % mapId)
    return result[0]


default_fields = [
    MapFieldEnum.mapId,
    MapFieldEnum.name,
    MapFieldEnum.version,
    MapFieldEnum.lastUpdatedBy,
    MapFieldEnum.lastUpdatedOn,
]


@router.get("/maps/", summary="Gets all maps, optionally filtered")
@version(1)
def maps(
    fields: List[MapFieldEnum] = Query(default_fields),
    version: VersionEnum
    | str = Query(
        "latest",
        description="<i>Available values</i> : "
        "'all' for all versions, "
        "'latest' for latest, "
        "or an integer for a specific version",
    ),
    filters: MapFilters = Depends(),
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["read"]]),
) -> List[dict[str, Any]]:
    # translate to str from Enum:
    if not type(version) == str:
        version = version.name
    # deal with parsing versions
    result = elastic_backend.get_maps(
        fields=[f.name for f in fields], filters=filters, version=version
    )

    return result


@router.put("/map/id/{mapId}/")
@version(1)
def update_map(
    mapId: str,
    mapRevision: MapRevision,
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["write"]]),
) -> dict:
    try:
        return elastic_backend.update_map(mapId, mapRevision, user)
    except TerranovaNotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/map/")
@version(1)
def create_map(
    mapRevision: MapRevision, user: User = Security(auth_check, scopes=[TOKEN_SCOPES["write"]])
):
    return elastic_backend.create_map(mapRevision, user)


@router.post("/map/id/{mapId}/publish/")
@version(1)
def publish_map(
    mapId: str,
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["publish"]]),
):
    return elastic_backend.publish_map(map_id=mapId, user=user)


@router.get("/public/maps/")
@version(1)
def public_maps(
    fields: List[MapFieldEnum] = Query(default_fields),
    version: VersionEnum
    | str = Query(
        "latest",
        description="<i>Available values</i> : "
        "'all' for all versions, "
        "'latest' for latest, "
        "or an integer for a specific version",
    ),
    filters: PublicMapFilters = Depends(),
):
    return elastic_backend.get_public_maps(
        fields=[f.name for f in fields], filters=filters, version=version
    )
