from fastapi import APIRouter, Depends, HTTPException, Query, Security
from terranova.settings import TOKEN_SCOPES
from fastapi_versioning import version
from typing import List, Any

from terranova.backends.auth import User, auth_check
from terranova.backends.elasticsearch import backend as elastic_backend
from terranova.models import (
    Template,
    TemplateFieldEnum,
    TemplateFilters,
    VersionEnum,
    NewTemplate,
)

router = APIRouter(tags=["Terranova Node Templates"])


@router.get("/template/id/{templateId}/")
@version(1)
def template_by_id(
    templateId: str, user: User = Security(auth_check, scopes=[TOKEN_SCOPES["read"]])
) -> Template:
    result = elastic_backend.get_templates(template_id=templateId)
    if len(result) < 1:
        raise HTTPException(status_code=404, detail="Template not found")
    return result[0]


default_fields = [
    TemplateFieldEnum.templateId,
    TemplateFieldEnum.name,
    TemplateFieldEnum.version,
    TemplateFieldEnum.lastUpdatedBy,
    TemplateFieldEnum.lastUpdatedOn,
]


@router.get("/templates/")
@version(1)
def templates(
    fields: List[TemplateFieldEnum] = Query(default_fields),
    version: VersionEnum
    | str = Query(
        "latest",
        description="<i>Available values</i> : "
        "'all' for all versions, "
        "'latest' for latest, "
        "or an integer for a specific version",
    ),
    filters: TemplateFilters = Depends(),
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["read"]]),
) -> List[dict[str, Any]]:
    # translate to str from Enum:
    if not type(version) == str:
        version = version.name
    # deal with parsing versions
    result = elastic_backend.get_templates(
        fields=[f.name for f in fields], filters=filters, version=version
    )
    if len(result) < 1:
        raise HTTPException(status_code=404, detail="No templates found")
    return result


@router.put("/template/id/{templateId}/")
@version(1)
def update_template(
    templateId: str,
    new_template: NewTemplate,
    user: User = Security(auth_check, scopes=[TOKEN_SCOPES["write"]]),
) -> dict:
    result = elastic_backend.update_template(templateId, new_template, user)
    if not result:
        raise HTTPException(status_code=404, detail="Template not updated")
    return result


@router.post("/template/")
@version(1)
def create_template(
    new_template: NewTemplate, user: User = Security(auth_check, scopes=[TOKEN_SCOPES["write"]])
):
    result = elastic_backend.create_template(new_template, user)
    return result
