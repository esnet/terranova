from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool
from sqlalchemy import Column, Integer, String
from sqlalchemy.dialects import sqlite
from sqlalchemy import func, text, column, exists, and_, or_

from opentelemetry import trace
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor

from terranova.settings import (
    GOOGLE_SHEETS_CACHE_FILE,
    DEFAULT_NODE_TEMPLATES,
    GOOGLE_SHEETS_ENCRYPTION_KEY,
    GOOGLE_SHEETS_CREDENTIALS,
    GOOGLE_SHEETS_READ_INDEX,
    GOOGLE_SHEETS_WRITE_INDEX,
    GOOGLE_SHEETS_TABLE_NAME,
    GOOGLE_SHEETS_META_TABLE_NAME,
)
from terranova.abstract_models import SQLiteCacheDatasource, Topology, QueryFilter, InputModifier
from terranova.logging import logger
from terranova import models
from terranova.backends.elasticsearch import backend as elastic_backend

from .settings import METADATA

from jinja2 import Template as JinjaTemplate

from typing import Dict, List, Any

from Crypto.Cipher import AES
from Crypto.Hash import HMAC, SHA256
from Crypto.Random import get_random_bytes

from sqlalchemy.orm import Query as SQLQuery

import json
import base64

from io import BytesIO

engine = create_engine(
    "sqlite:///" + GOOGLE_SHEETS_CACHE_FILE,
    connect_args={"check_same_thread": False},
    poolclass=NullPool,
)
paths = {}

SQLAlchemyInstrumentor().instrument(engine=engine)

tracer = trace.get_tracer(__name__)

# SQLAlchemy Models
Base = declarative_base()


class EdgeTable(Base):
    __tablename__ = GOOGLE_SHEETS_TABLE_NAME

    id = Column(Integer, primary_key=True)
    sheet_id = Column(String)
    edge = Column(sqlite.JSON)


class SheetMetadata(Base):
    __tablename__ = GOOGLE_SHEETS_META_TABLE_NAME

    sheet_id = Column(String, primary_key=True)
    sheet_name = Column(String)
    columns = Column(sqlite.JSON)
    types = Column(sqlite.JSON)

    def to_dict(self):
        return {column.name: getattr(self, column.name) for column in type(self).__table__.columns}


class GoogleSheetsBackend(SQLiteCacheDatasource):
    """
    This class is intended to be used as the interaction point between Terranova
    and data stored in Google Sheets
    """

    def __init__(self):
        self.session = sessionmaker(bind=engine)()
        Base.metadata.create_all(engine)

    @property
    def record_model(self):
        from .models import Edge

        return Edge

    @property
    def json_column(self):
        return EdgeTable.edge

    @property
    def table_model(self):
        return EdgeTable

    def list_sheets(self, limit=None):
        query = self.session.query(SheetMetadata)
        count = query.count()
        if limit is not None:
            query = query.limit(limit)
        rows = query.all()
        # Each row is returned as a tuple containing 1 dictionary, remove that
        # unneeded layer here when we return
        return models.QueryResult(count=count, data=[r.to_dict() for r in rows])

    def list_datasources(self):
        output = []
        result = self.list_sheets()
        for sheet in result.data:
            if sheet.get("columns"):  # sheet matches terranova format
                metadata = {k: v for k, v in METADATA.items()}
                metadata["context"] = {"sheet_id": sheet["sheet_id"]}
                metadata["display_name"] = "📊 " + sheet["sheet_name"]
                metadata["distinct_values_endpoint"] = metadata["distinct_values_endpoint"].format(
                    sheet_id=sheet["sheet_id"]
                )
                metadata["query_endpoint"] = metadata["query_endpoint"].format(
                    sheet_id=sheet["sheet_id"]
                )
                metadata["filterable_columns_endpoint"] = metadata[
                    "filterable_columns_endpoint"
                ].format(sheet_id=sheet["sheet_id"])
                output.append(metadata)
        return output

    def list_columns(self, sheet_id):
        query = self.session.query(SheetMetadata)
        query = query.filter_by(sheet_id=sheet_id)
        try:
            return query.all()[0].columns
        except IndexError:
            return []

    def create_credential(self, name, json_credential):
        # decode JSON to ensure it's valid
        json.loads(json_credential)

        # the cryptography functionality below performs two-way
        # encryption on the posted JSON (which includes a private key)
        # it is mostly cribbed from
        # https://www.pycryptodome.org/src/examples#encrypt-and-authenticate-data-in-one-step
        # it is encrypted using the value of GOOGLE_SHEETS_ENCRYPTION_KEY

        # encode original JSON string to bytes
        data = json_credential.encode()

        # generate 32 bytes data from our hash key as the AES key
        sha = SHA256.new()
        sha.update(GOOGLE_SHEETS_ENCRYPTION_KEY)
        aes_key = sha.digest()
        hmac_key = get_random_bytes(16)

        cipher = AES.new(aes_key, AES.MODE_CTR)
        ciphertext = cipher.encrypt(data)

        hmac = HMAC.new(hmac_key, digestmod=SHA256)
        tag = hmac.update(cipher.nonce + ciphertext).digest()

        # encrypt original JWT credential with AES-256
        with BytesIO() as f:
            f.write(tag)
            f.write(cipher.nonce)
            f.write(ciphertext)
            f.seek(0)
            encrypted_bytes = f.read()

        doc = {"name": name, "jwt": base64.encode(encrypted_bytes)}
        elastic_backend.create(index=GOOGLE_SHEETS_WRITE_INDEX, id=name, doc=doc)

    def list_credentials(self, sanitize=True):
        """
        list_credentials returns the list of DB-stored credentials. This is used when
        GOOGLE_SHEETS_CREDENTIAL_SOURCE is 'dynamic'
        """
        query = {"bool": {"filter": "*"}}
        rows = elastic_backend.query(index=GOOGLE_SHEETS_READ_INDEX, query=query)
        count = len(rows)
        data = []
        for cred in rows:
            cred = self.decrypt_credential(cred)
            if sanitize:
                data.append(self.sanitize_credential(cred))
        return models.QueryResult(count=count, data=data)

    def delete_credential(self, project_id):
        """
        delete_credential deletes the first credential matching the given project_id
        """
        query = {
            "bool": {
                "filter": [
                    {
                        "query_string": {
                            "query": "project_id: '%s'" % project_id,
                            "analyze_wildcard": "true",
                        }
                    }
                ]
            }
        }
        rows = elastic_backend.query(GOOGLE_SHEETS_READ_INDEX, query=query, limit=1)
        elastic_backend.delete_by_query(GOOGLE_SHEETS_READ_INDEX, query=query, max_docs=1)
        data = []
        for cred in rows:
            cred = self.decrypt_credential(cred)
            data.append(self.sanitize_credential(cred))
        return data

    def sanitize_credential(self, cred):
        """
        remove live credential sections of stored google sheets credentials for presentation
        """
        keys_to_delete = [
            "private_key",
            "private_key_id",
            "auth_provider_x509_cert_url",
            "client_x509_cert_url",
        ]
        keys_to_redact = ["client_email", "client_id"]
        for k in keys_to_delete:
            if k in cred:
                del cred[k]
        for k in keys_to_redact:
            cred[k] = "XXXXXXXXXXXXXX"
        return cred

    def list_static_credentials(self):
        """
        list_static_credentials return the list of statically-configured google sheets
        credentials. These are provided as part of the terranova config file rather than
        stored encrypted in the elastic store
        """
        return models.QueryResult(
            count=len(GOOGLE_SHEETS_CREDENTIALS),
            data=list(map(self.sanitize_credential, GOOGLE_SHEETS_CREDENTIALS)),
        )

    def apply_filters(
        self,
        query: SQLQuery,
        filters: list[QueryFilter],
        apply_templated_filters=None,
        sheet_id=None,
    ):
        # type filters model all of the modelled varations of fields + operators
        from .models import TypeFilters

        metadata = None
        if sheet_id:
            metadata_query = self.session.query(SheetMetadata)
            metadata_query = metadata_query.filter_by(sheet_id=sheet_id)
            metadata = metadata_query.all()[0]
        standard_filters = []
        if not metadata:
            return super().apply_filters(query, filters, apply_templated_filters)
        for filter in filters:
            field = filter.field
            operator = filter.operator
            value = filter.value
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

            # if this isn't a modelled field
            if not hasattr(TypeFilters, field):
                # check whether the field name is in the sheet-specific fields.
                if field in metadata.columns:
                    # if it is a sheet-specific field,
                    offset = metadata.columns.index(field)
                    # check whether that field is a scalar or array
                    type = metadata.types[offset]
                    # add appropriate logic for scalars vs arrays to the query
                    if field.startswith("endpoints_"):
                        prefix = "endpoints_"
                        json_selector = "$.endpoints"
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
                    elif type == "array":
                        query = query.filter(
                            exists()
                            .select_from(
                                func.json_each(func.json_extract(self.json_column, f"$.{field}"))
                            )
                            .where(LOGIC(column("value").op(COMPARATOR)(v) for v in value))
                        )
                    elif type == "scalar":
                        query = query.filter(
                            LOGIC(
                                func.json_extract(self.json_column, f"$.{field}").op(COMPARATOR)(v)
                                for v in value
                            )
                        )
            # otherwise, if this is a modelled field do the query logic 'normally'
            else:
                standard_filters.append(filter)
            query = super().apply_filters(query, standard_filters, apply_templated_filters)
        return query

    def query(
        self, filters: Dict[str, List[str]], limit=10, apply_templated_filters=True, sheet_id=None
    ) -> models.QueryResult:
        if sheet_id is None:
            raise Exception("Misconfigured Query. Queries to google sheets require a sheet id.")
        query = self.session.query(EdgeTable.edge)
        query = query.filter_by(sheet_id=sheet_id)
        query = self.apply_filters(query, filters, apply_templated_filters, sheet_id)
        query = query.order_by(EdgeTable.edge["id"])
        count = query.count()
        if limit is not None:
            query = query.limit(limit)
        rows = query.all()
        # Each row is returned as a tuple containing 1 dictionary, remove that
        # unneeded layer here when we return
        return models.QueryResult(count=count, data=list(map(lambda x: x[0], rows)))

    # Explicitly trace the make_topology function as this can be time consuming
    @tracer.start_as_current_span("render_topology")
    def render_topology(
        self,
        dataset: models.Dataset,
        use_snapshot: bool = False,
        path_layout: Dict[Any, Any] = {"type": "curveCardinal", "tension": 0.6},
        node_template=DEFAULT_NODE_TEMPLATES["GEOGRAPHIC"],
        sheet_id=None,
    ) -> Topology:
        if use_snapshot:
            circuit_data = dataset.results
        else:
            circuit_data = self.query(dataset.query.filters, limit=None, sheet_id=sheet_id).data

        node_group_criteria = []
        if hasattr(dataset.query, "node_group_criteria") and dataset.query.node_group_criteria:
            node_group_criteria = dataset.query.node_group_criteria

        topo = self._render_geographic(circuit_data, node_template, node_group_criteria)

        # TODO - These all should come from somewhere. XXX: Need to modify the data model?
        # 'type': curveCardinal is now actually really important
        topo["layer"] = "tail"
        topo["name"] = dataset.name
        topo["pathLayout"] = path_layout

        return Topology(**topo)

    def _render_geographic(self, edge_data, node_template, node_group_criteria):
        def parse_attr_to_int(template, attr):
            import re

            regex = re.compile(r'%s="(\d+)"' % attr)
            match = regex.findall(template)
            if match:
                return int(match[0])
            return None

        def parse_height(template):
            return parse_attr_to_int(template, "data-height")

        def parse_width(template):
            return parse_attr_to_int(template, "data-width")

        nodes = {}  # use a dict here to "reduce" on collision
        topo = {"nodes": [], "edges": []}

        for edge in edge_data:
            endpoints = edge["endpoints"]

            endpoint_ids = {"names": []}
            for endpoint in endpoints:
                endpoint["endpoint_name"] = endpoint["name"]
                endpoint_ids["names"].append(endpoint["name"])
                endpoint_ids["edge_id"] = [edge.get("id")]
                endpoint_ids["edge_name"] = [edge.get("name")]

            edge_info = {
                "name": edge["name"],
                "coordinates": [
                    [float(endpoint["latitude"]), float(endpoint["longitude"])]
                    for endpoint in endpoints
                ],
                "meta": {
                    "capacity": edge.get("meta", {}).get("circuit_speed"),
                    "endpoint_identifiers": endpoint_ids,
                },
            }
            topo["edges"].append(edge_info)

            for endpoint in endpoints:
                endpoint_name = endpoint["name"]
                # copy node meta; we're going to modify keys below
                node_meta = {k: v for k, v in endpoint.items()}
                node_info = {
                    "name": endpoint_name,
                    "coordinate": [float(endpoint["latitude"]), float(endpoint["longitude"])],
                    "meta": node_meta,  # noqa: E501
                }
                node_meta["computed_width"] = parse_width(node_meta.get("svg", ""))
                node_meta["computed_height"] = parse_height(node_meta.get("svg", ""))
                # enter the node info for the bottom-tier node into the
                # dedupe dict
                nodes[node_info["name"]] = node_info
                last_child = node_info["name"]
                # now we turn our attention to assembling parent/group nodes
                # the idea here is that for each criterion, we'll form a parent
                # group.
                # in the parent group, we'll begin with a filled-out set of metadata
                # For each member of the group, we'll then remove any keys that
                # don't match previous members, thereby deriving the maximum
                # set of information that's common across our grouping criterion.
                for group_criterion in reversed(node_group_criteria):
                    node_name = endpoint.get(group_criterion)
                    # if this grouping criterion is not available,
                    # don't try to form a group on it...
                    if node_name is None:
                        continue
                    endpoint["endpoint_name"] = node_name
                    endpoint["group"] = group_criterion
                    if node_name in nodes:
                        node_info = nodes[node_name]
                        # progressively remove non-matching meta fields
                        for k, v in endpoint.items():
                            if node_info["meta"].get(k) and node_info["meta"].get(k) != v:
                                del node_info["meta"][k]
                    else:
                        # this transforms the data so far into the data
                        # that will be used for the meta dict.
                        node_meta = {k: v for k, v in endpoint.items()}
                        node_info = {
                            "name": node_name,
                            "coordinate": [0, 0],
                            "meta": node_meta,
                            "children": [],
                        }
                    if not node_info.get("children"):
                        node_info["children"] = []
                    if last_child not in node_info["children"]:
                        node_info["children"].append(last_child)
                    nodes[node_info["name"]] = node_info

                    last_child = node_name
        try:
            templ = JinjaTemplate(node_template)
        except Exception as e:
            logger.error("received exception on compile. Template was: %s" % node_template)
            raise e
        for node in nodes.values():
            node["endpoint_name"] = node.get("meta").get("endpoint_name")
            try:
                node["meta"]["svg"] = templ.render(**node)
            except Exception as e:
                logger.error("received exception on render. Template was: %s" % node_template)
                raise e
            topo["nodes"].append(node)

        topo["nodes"] = list(nodes.values())

        return topo
