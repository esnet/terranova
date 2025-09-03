from fastapi import APIRouter
from fastapi_versioning import version
from fastapi.responses import JSONResponse

from terranova.backends.datasources import datasources

from urllib.parse import urlencode

router = APIRouter(tags=["Datasource Plugin Metadata"])


@router.get("/datasources/", summary="Lists datasource metadata")
@version(1)
def ds_metadata():

    metadata = {}

    def flatten_metadata(datasources):
        for k, v in datasources.items():
            datasource_metadata = v.metadata()
            # if this datasource has a list of dicts rather than a flat dict
            # we should iterate over it, putting each sub-datasource
            # into the metadata list.
            if type(datasource_metadata) == list:
                for item in datasource_metadata:
                    key = "%s?%s" % (k, urlencode(item["context"]))
                    metadata[key] = item
                # continue the *outer* loop
                continue
            metadata[k] = datasource_metadata

    flatten_metadata(datasources)

    return JSONResponse(metadata)
