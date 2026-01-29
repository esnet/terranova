from fastapi import APIRouter, HTTPException, Security
from terranova.settings import TOKEN_SCOPES
from fastapi_versioning import version
from terranova.backends.auth import User, auth_check
from terranova.backends.storage import backend as storage_backend
from terranova.models import UserData, UserDataRevision, TerranovaNotFoundException

router = APIRouter(tags=["Terranova User Data"])


@router.get("/userdata/", summary="Gets user data for the currently logged-in user")
@version(1)
def get_userdata(user: User = Security(auth_check, scopes=[TOKEN_SCOPES["read"]])) -> UserData:
    result = storage_backend.get_userdata(user)
    if len(result) < 1:
        raise HTTPException(status_code=404, detail="User Data not found")
    return result[0]


@router.post("/userdata/", summary="Create user data for the currently logged-in user")
@version(1)
def create_userdata(
    new_data: UserDataRevision, user: User = Security(auth_check, scopes=[TOKEN_SCOPES["read"]])
):
    result = storage_backend.create_userdata(userdata=new_data, user=user)
    return result


@router.put("/userdata/", summary="Update user data for the currently logged-in user")
@version(1)
def update_userdata(
    update_data: UserDataRevision, user: User = Security(auth_check, scopes=[TOKEN_SCOPES["read"]])
):
    try:
        return storage_backend.update_userdata(userdata=update_data, user=user)
    except TerranovaNotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
