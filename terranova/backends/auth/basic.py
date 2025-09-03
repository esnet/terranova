from fastapi import Depends, HTTPException
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry import trace
from fastapi.security import HTTPBasic, HTTPBasicCredentials, SecurityScopes

from sqlalchemy import create_engine, Column, Integer, Text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool
from sqlalchemy.dialects import sqlite

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
    scope = Column(sqlite.JSON)


engine = create_engine(
    "sqlite:///" + BASIC_AUTH_DB_FILENAME,
    connect_args={"check_same_thread": False},
    poolclass=NullPool,
)
SQLAlchemyInstrumentor().instrument(engine=engine)

tracer = trace.get_tracer(__name__)


class BasicBackend:
    def __init__(self):
        UserTable.__table__.create(bind=engine, checkfirst=True)
        self.session = sessionmaker(bind=engine)()
        if not self.session.query(UserTable).filter_by(id=1).first():
            self.create_user(
                email="admin",
                name="Administration User",
                password="admin",
                scope=[s for s in TOKEN_SCOPES.values()],
            )

    def query(self, username=None, limit=10):
        query = self.session.query(UserTable)
        if username:
            query = query.filter_by(username=username)
        if limit:
            query = query.limit(limit)
        rows = query.all()
        return rows

    def get_user(self, username, password):
        db_user = self.session.query(UserTable).filter_by(username=username).first()
        if db_user and bcrypt.checkpw(password.encode(), db_user.password):
            return User(
                username=db_user.username,
                email=db_user.username,
                name=db_user.name,
                scope=db_user.scope,
            )
        else:
            raise HTTPException(status_code=401, detail="Invalid user")

    def create_user(self, email, name, password, scope):
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password.encode(), salt)
        new_user = UserTable(username=email, name=name, password=hashed_password, scope=scope)
        self.session.add(new_user)
        self.session.commit()
        return User(
            username=new_user.username,
            email=new_user.username,
            name=new_user.name,
            scope=new_user.scope,
        )

    def delete_user(self, db_user):
        self.session.delete(db_user)
        self.session.commit()
        return User(
            username=db_user.username,
            email=db_user.username,
            name=db_user.name,
            scope=db_user.scope,
        )

    def update_user(self, db_user, email=None, name=None, password=None, scope=None):
        if email:
            db_user.username = email
        if name:
            db_user.name = name
        if scope:
            db_user.scope = scope
        if password:
            salt = bcrypt.gensalt()
            hashed_password = bcrypt.hashpw(password.encode(), salt)
            db_user.password = hashed_password
        self.session.commit()
        return User(
            username=db_user.username,
            email=db_user.username,
            name=db_user.name,
            scope=db_user.scope,
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
