from fastapi import Depends, HTTPException
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry import trace
from fastapi.security import HTTPBasic, HTTPBasicCredentials, SecurityScopes

import json
from sqlalchemy import create_engine, Column, Integer, Text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool

from terranova.settings import (
    BASIC_AUTH_DB_FILENAME,
    TOKEN_SCOPES,
)

import bcrypt
from pydantic import BaseModel


# common model for all backends
class User(BaseModel):
    name: str
    email: str
    username: str
    scope: list[str]


# SQLAlchemy Models
Base = declarative_base()


class UserTable(Base):
    __tablename__ = "user"

    id = Column(Integer, primary_key=True)
    # username used to store both email and username
    username = Column(Text)
    name = Column(Text)
    password = Column(Text)
    scope = Column(Text)  # stored as JSON string to avoid SQLAlchemy type-processor issues


engine = create_engine(
    "sqlite:///" + BASIC_AUTH_DB_FILENAME,
    connect_args={"check_same_thread": False},
    poolclass=NullPool,
)
# Session factory — create one session per operation to avoid thread-safety issues
SessionFactory = sessionmaker(engine, expire_on_commit=False)
if not SQLAlchemyInstrumentor().is_instrumented_by_opentelemetry:
    SQLAlchemyInstrumentor().instrument(engine=engine)

tracer = trace.get_tracer(__name__)


def _decode_scope(raw):
    """scope is stored as a JSON string; decode it back to a list."""
    if raw is None:
        return []
    if isinstance(raw, list):
        return raw
    return json.loads(raw)


def _decode_password(raw):
    """password is stored as a UTF-8 string; return bytes for bcrypt."""
    if isinstance(raw, bytes):
        return raw
    return raw.encode("utf-8")


class BasicBackend:
    def __init__(self):
        UserTable.__table__.create(bind=engine, checkfirst=True)
        with SessionFactory() as session:
            if not session.query(UserTable).filter_by(id=1).first():
                self.create_user(
                    email="admin",
                    name="Administration User",
                    password="admin",
                    scope=[s for s in TOKEN_SCOPES.values()],
                )

    def query(self, username=None, limit=10):
        with SessionFactory() as session:
            q = session.query(UserTable)
            if username:
                q = q.filter_by(username=username)
            if limit:
                q = q.limit(limit)
            # expunge so objects are usable outside this session
            rows = q.all()
            for row in rows:
                session.expunge(row)
        return rows

    def get_user(self, username, password):
        with SessionFactory() as session:
            db_user = session.query(UserTable).filter_by(username=username).first()
            if db_user:
                session.expunge(db_user)
        if db_user and bcrypt.checkpw(password.encode(), _decode_password(db_user.password)):
            return User(
                username=db_user.username,
                email=db_user.username,
                name=db_user.name,
                scope=_decode_scope(db_user.scope),
            )
        raise HTTPException(status_code=401, detail="Invalid user")

    def create_user(self, email, name, password, scope):
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password.encode(), salt).decode("utf-8")
        new_user = UserTable(
            username=email, name=name,
            password=hashed_password,
            scope=json.dumps(scope),
        )
        with SessionFactory() as session:
            session.add(new_user)
            session.commit()
            session.expunge(new_user)
        return User(
            username=new_user.username,
            email=new_user.username,
            name=new_user.name,
            scope=_decode_scope(new_user.scope),
        )

    def delete_user(self, db_user):
        scope = _decode_scope(db_user.scope)
        with SessionFactory() as session:
            merged = session.merge(db_user)
            session.delete(merged)
            session.commit()
        return User(
            username=db_user.username,
            email=db_user.username,
            name=db_user.name,
            scope=scope,
        )

    def update_user(self, db_user, email=None, name=None, password=None, scope=None):
        with SessionFactory() as session:
            merged = session.merge(db_user)
            if email:
                merged.username = email
            if name:
                merged.name = name
            if scope is not None:
                merged.scope = json.dumps(scope)
            if password:
                salt = bcrypt.gensalt()
                merged.password = bcrypt.hashpw(password.encode(), salt).decode("utf-8")
            session.commit()
            session.expunge(merged)
        return User(
            username=merged.username,
            email=merged.username,
            name=merged.name,
            scope=_decode_scope(merged.scope),
        )


backend = BasicBackend()

security = HTTPBasic()


def read_write_auth(username, password) -> User:
    needed_scopes = TOKEN_SCOPES["write"]
    return get_user(username, password, needed_scopes)


def get_user(username, password, needed_scopes) -> User:
    user = backend.get_user(username, password)

    token_scopes = user.scope

    for scope in needed_scopes.scopes:
        if scope not in token_scopes:
            raise HTTPException(
                status_code=401,
                detail="Insufficient permissions for this action. "
                "Required Scopes: %s Found Scopes: %s" % (needed_scopes.scopes, token_scopes),
            )

    return user


# This is the function that API calls should use as a Depends to ensure
# that they get back the current User from the Authorization header
def auth_check(
    needed_scopes: SecurityScopes, credentials: HTTPBasicCredentials = Depends(security)
):
    return get_user(credentials.username, credentials.password, needed_scopes)


def optional_auth_check(
    username,
    password,
    needed_scopes: SecurityScopes = [TOKEN_SCOPES["read"]],
) -> User | None:
    if username and password:
        return get_user(username, password, needed_scopes)
    return None
