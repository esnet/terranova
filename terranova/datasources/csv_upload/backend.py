from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool
from sqlalchemy import Column, Integer, String
from sqlalchemy.dialects import sqlite
from sqlalchemy import func, text, column, exists, and_, or_

from opentelemetry import trace
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor

from terranova.settings import (
    CSV_UPLOAD_CACHE_FILE,
    DEFAULT_NODE_TEMPLATES,
    CSV_UPLOAD_TABLE_NAME,
    CSV_UPLOAD_META_TABLE_NAME,
)
from terranova.abstract_models import SQLiteCacheDatasource, Topology, QueryFilter, InputModifier
from terranova.logging import logger
from terranova import models

from .settings import METADATA

from jinja2 import Template as JinjaTemplate

from typing import Dict, List, Any

from sqlalchemy.orm import Query as SQLQuery

engine = create_engine(
    "sqlite:///" + CSV_UPLOAD_CACHE_FILE,
    connect_args={"check_same_thread": False},
    poolclass=NullPool,
)

if not SQLAlchemyInstrumentor().is_instrumented_by_opentelemetry:
    SQLAlchemyInstrumentor().instrument(engine=engine)

tracer = trace.get_tracer(__name__)

Base = declarative_base()


class CSVEdgeTable(Base):
    __tablename__ = CSV_UPLOAD_TABLE_NAME

    id = Column(Integer, primary_key=True)
    csv_id = Column(String)
    edge = Column(sqlite.JSON)


class CSVMetadata(Base):
    __tablename__ = CSV_UPLOAD_META_TABLE_NAME

    csv_id = Column(String, primary_key=True)
    csv_name = Column(String)
    columns = Column(sqlite.JSON)
    types = Column(sqlite.JSON)

    def to_dict(self):
        return {col.name: getattr(self, col.name) for col in type(self).__table__.columns}


class CSVBackend(SQLiteCacheDatasource):

    def __init__(self, engine=None):
        _engine = engine or globals()["engine"]
        self.session = sessionmaker(bind=_engine)()
        Base.metadata.create_all(_engine)

    @property
    def record_model(self):
        from .models import Edge
        return Edge

    @property
    def json_column(self):
        return CSVEdgeTable.edge

    @property
    def table_model(self):
        return CSVEdgeTable

    def list_csvs(self, limit=None):
        query = self.session.query(CSVMetadata)
        count = query.count()
        if limit is not None:
            query = query.limit(limit)
        rows = query.all()
        return models.QueryResult(count=count, data=[r.to_dict() for r in rows])

    def list_datasources(self):
        output = []
        result = self.list_csvs()
        for csv in result.data:
            if csv.get("columns"):
                metadata = {k: v for k, v in METADATA.items()}
                metadata["context"] = {"csv_id": csv["csv_id"]}
                metadata["display_name"] = "📄 " + csv["csv_name"]
                metadata["distinct_values_endpoint"] = metadata[
                    "distinct_values_endpoint"
                ].format(csv_id=csv["csv_id"])
                metadata["query_endpoint"] = metadata["query_endpoint"].format(
                    csv_id=csv["csv_id"]
                )
                metadata["filterable_columns_endpoint"] = metadata[
                    "filterable_columns_endpoint"
                ].format(csv_id=csv["csv_id"])
                output.append(metadata)
        return output

    def list_columns(self, csv_id):
        query = self.session.query(CSVMetadata)
        query = query.filter_by(csv_id=csv_id)
        try:
            return query.all()[0].columns
        except IndexError:
            return []

    def insert_dataset(self, csv_id, csv_name, edges, columns, types):
        meta = CSVMetadata(
            csv_id=csv_id,
            csv_name=csv_name,
            columns=columns,
            types=types,
        )
        self.session.merge(meta)
        for edge in edges:
            row = CSVEdgeTable(csv_id=csv_id, edge=edge)
            self.session.add(row)
        self.session.commit()

    def delete_dataset(self, csv_id):
        self.session.query(CSVEdgeTable).filter_by(csv_id=csv_id).delete()
        self.session.query(CSVMetadata).filter_by(csv_id=csv_id).delete()
        self.session.commit()

    def apply_filters(
        self,
        query: SQLQuery,
        filters: list[QueryFilter],
        apply_templated_filters=None,
        csv_id=None,
    ):
        from .models import TypeFilters

        metadata = None
        if csv_id:
            metadata_query = self.session.query(CSVMetadata)
            metadata_query = metadata_query.filter_by(csv_id=csv_id)
            rows = metadata_query.all()
            if rows:
                metadata = rows[0]

        standard_filters = []
        if not metadata:
            return super().apply_filters(query, filters, apply_templated_filters)

        for filter in filters:
            field = filter.field
            operator = filter.operator
            value = filter.value

            NOT = operator == InputModifier.not_equal
            NLIKE = operator == InputModifier.not_like
            LIKE = operator == InputModifier.like

            if LIKE or NLIKE:
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

            if not hasattr(TypeFilters, field):
                if field in metadata.columns:
                    offset = metadata.columns.index(field)
                    type = metadata.types[offset]
                    if field.startswith("endpoints_"):
                        prefix = "endpoints_"
                        json_selector = "$.endpoints"
                        filter_fieldname = field.split(prefix)[1]
                        LOCAL_COMPARATOR = "="
                        if LIKE:
                            LOCAL_COMPARATOR = "like"
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
            else:
                standard_filters.append(filter)
            query = super().apply_filters(query, standard_filters, apply_templated_filters)
        return query

    def query(
        self, filters: Dict[str, List[str]], limit=10, apply_templated_filters=True, csv_id=None
    ) -> models.QueryResult:
        if csv_id is None:
            raise Exception("Misconfigured Query. Queries to CSV upload require a csv_id.")
        query = self.session.query(CSVEdgeTable.edge)
        query = query.filter_by(csv_id=csv_id)
        query = self.apply_filters(query, filters, apply_templated_filters, csv_id)
        query = query.order_by(CSVEdgeTable.edge["id"])
        count = query.count()
        if limit is not None:
            query = query.limit(limit)
        rows = query.all()
        return models.QueryResult(count=count, data=list(map(lambda x: x[0], rows)))

    @tracer.start_as_current_span("render_topology")
    def render_topology(
        self,
        dataset: models.Dataset,
        use_snapshot: bool = False,
        path_layout: Dict[Any, Any] = {"type": "curveCardinal", "tension": 0.6},
        node_template=DEFAULT_NODE_TEMPLATES["GEOGRAPHIC"],
        csv_id=None,
    ) -> Topology:
        if use_snapshot:
            circuit_data = dataset.results
        else:
            circuit_data = self.query(dataset.query.filters, limit=None, csv_id=csv_id).data

        node_group_criteria = []
        if hasattr(dataset.query, "node_group_criteria") and dataset.query.node_group_criteria:
            node_group_criteria = dataset.query.node_group_criteria

        topo = self._render_geographic(circuit_data, node_template, node_group_criteria)

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

        nodes = {}
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
                node_meta = {k: v for k, v in endpoint.items()}
                node_info = {
                    "name": endpoint_name,
                    "coordinate": [float(endpoint["latitude"]), float(endpoint["longitude"])],
                    "meta": node_meta,
                }
                node_meta["computed_width"] = parse_width(node_meta.get("svg", ""))
                node_meta["computed_height"] = parse_height(node_meta.get("svg", ""))
                nodes[node_info["name"]] = node_info
                last_child = node_info["name"]

                for group_criterion in reversed(node_group_criteria):
                    node_name = endpoint.get(group_criterion)
                    if node_name is None:
                        continue
                    endpoint["endpoint_name"] = node_name
                    endpoint["group"] = group_criterion
                    if node_name in nodes:
                        node_info = nodes[node_name]
                        for k, v in endpoint.items():
                            if node_info["meta"].get(k) and node_info["meta"].get(k) != v:
                                del node_info["meta"][k]
                    else:
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
