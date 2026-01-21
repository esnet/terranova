import sqlite3
import secrets
import string
import json
from pathlib import Path
from terranova.settings import config
from .constants import INITIAL_TEMPLATES
from terranova.backends.auth import User
from terranova.models import (
    Dataset,
    Map,
    Template,
    PublicMapFilters,
    MapFilters,
    DatasetFilters,
    TemplateFilters,
    MapRevision,
    DatasetRevision,
    NewTemplate,
    TerranovaNotFoundException,
    UserData,
    UserDataRevision,
    TerranovaVersion,
)
from datetime import datetime
from typing import List, Any, Dict
import threading


class SQLiteBackend:
    """
    SQLite-based storage backend providing equivalent functionality to ElasticSearchBackend.
    This backend stores all data in a local SQLite database.
    """

    def __init__(self, db_path: str = None):
        if db_path is None:
            db_path = config.get("sqlite", {}).get("path", ":memory:")
        self.db_path = db_path
        self._local = threading.local()
        self.create_indices()

    @property
    def conn(self):
        """Thread-local database connection"""
        if not hasattr(self._local, 'conn'):
            self._local.conn = sqlite3.connect(self.db_path, check_same_thread=False)
            self._local.conn.row_factory = sqlite3.Row
        return self._local.conn

    # General database functions
    def create(self, table: str, id: str, doc: dict):
        """Create a document in the specified table"""
        cursor = self.conn.cursor()

        # Convert doc to JSON for storage, handling datetime objects
        doc_json = json.dumps(doc, default=str)

        cursor.execute(
            f"INSERT INTO {table} (id, document) VALUES (?, ?)",
            (id, doc_json)
        )
        self.conn.commit()

        return {"result": "created", "id": id}

    def update(self, table: str, id: str, doc: dict):
        """Update a document in the specified table"""
        cursor = self.conn.cursor()

        # Check if document exists
        cursor.execute(f"SELECT id FROM {table} WHERE id = ?", (id,))
        if cursor.fetchone() is None:
            raise TerranovaNotFoundException(f"Document with id : {id} not found")

        # Update the document, handling datetime objects
        doc_json = json.dumps(doc, default=str)
        cursor.execute(
            f"UPDATE {table} SET document = ? WHERE id = ?",
            (doc_json, id)
        )
        self.conn.commit()

        return {"result": "updated"}

    def query(
        self,
        table: str,
        query: dict,
        collapse: dict = None,
        sort: List[dict] = None,
        fields: List[str] = None,
        limit: int = 10000,
    ):
        """Query documents from the specified table"""
        cursor = self.conn.cursor()

        # Fetch all documents from the table
        cursor.execute(f"SELECT document FROM {table}")
        rows = cursor.fetchall()

        # Parse JSON and filter
        results = []
        for row in rows:
            doc = json.loads(row[0])
            if self._matches_query(doc, query):
                results.append(doc)

        # Apply sorting
        if sort:
            for sort_field in reversed(sort):
                for field_name, sort_order in sort_field.items():
                    reverse = sort_order.get("order", "asc") == "desc"
                    results.sort(key=lambda x: x.get(field_name, 0), reverse=reverse)

        # Apply collapse (get latest version of each unique field value)
        if collapse:
            collapse_field = collapse["field"]
            collapsed_results = {}
            for doc in results:
                field_value = doc.get(collapse_field)
                if field_value not in collapsed_results:
                    collapsed_results[field_value] = doc
                elif doc.get("version", 0) > collapsed_results[field_value].get("version", 0):
                    collapsed_results[field_value] = doc
            results = list(collapsed_results.values())

        # Apply field filtering
        if fields:
            filtered_results = []
            for doc in results:
                filtered_doc = {k: v for k, v in doc.items() if k in fields}
                filtered_results.append(filtered_doc)
            results = filtered_results

        # Apply limit
        results = results[:limit]

        return results

    def _matches_query(self, doc: dict, query: dict) -> bool:
        """Check if a document matches the given query"""
        if "bool" not in query:
            return True

        filters = query["bool"].get("filter", [])
        for filter_item in filters:
            if "term" in filter_item:
                for field, value in filter_item["term"].items():
                    if doc.get(field) != value:
                        return False
            elif "terms" in filter_item:
                for field, values in filter_item["terms"].items():
                    if doc.get(field) not in values:
                        return False

        return True

    def delete_by_query(self, table: str, query: dict, max_docs=1):
        """Delete documents matching the query"""
        cursor = self.conn.cursor()

        # Fetch matching documents
        matching_docs = self.query(table, query, limit=max_docs)

        # Delete them
        deleted_count = 0
        for doc in matching_docs:
            # Find the document ID (varies by table)
            doc_id = None
            for id_field in ["mapId", "datasetId", "templateId", "username"]:
                if id_field in doc:
                    doc_id = doc[id_field]
                    break

            if doc_id:
                cursor.execute(f"DELETE FROM {table} WHERE id = ?", (doc_id,))
                deleted_count += 1

        self.conn.commit()
        return {"deleted": deleted_count}

    def generate_id(self):
        """Generate a 7-character alphanumeric ID"""
        alphabet = string.ascii_letters + string.digits
        return "".join(secrets.choice(alphabet) for i in range(7))

    # User Data
    def get_userdata(self, user: User):
        """Get user data for a specific user"""
        filter_spec = {"term": {"username": user.username}}
        query = {"bool": {"filter": [filter_spec]}}
        return self.query("userdata", query)

    def create_userdata(self, userdata: UserDataRevision, user: User):
        """Create user data"""
        to_create = {
            "username": user.username,
            "favorites": userdata.favorites,
            "lastEdited": userdata.lastEdited,
        }
        response = self.create(
            "userdata",
            id=user.username,
            doc=UserData(**to_create).model_dump(),
        )
        output = {"result": response.get("result"), "object": to_create}
        return output

    def update_userdata(self, userdata: UserDataRevision, user: User):
        """Update user data"""
        existing_user = self.get_userdata(user)

        if len(existing_user) == 0:
            raise TerranovaNotFoundException("Cannot find user data for %s" % user.username)

        to_update = {
            "username": user.username,
            "favorites": userdata.favorites,
            "lastEdited": userdata.lastEdited,
        }
        response = self.update(
            "userdata",
            id=user.username,
            doc=UserData(**to_update).model_dump(),
        )
        output = {"result": response.get("result"), "object": to_update}
        return output

    # Maps
    def get_maps(
        self,
        map_id: str = None,
        fields: List[str] = None,
        filters: MapFilters = MapFilters(),
        version: TerranovaVersion = None,
    ):
        """Get maps with optional filtering"""
        filter_spec = []
        if map_id is not None:
            filter_spec.append({"term": {"mapId": map_id}})

        for term, value in filters.items():
            if type(value) == bool:
                filter_spec.append({"term": {term: value}})
                continue
            if value is not None and len(value) >= 1:
                filter_spec.append({"terms": {term: value}})

        # default for 'latest'
        collapse = {"field": "mapId"}
        if version:
            version_val = str(version)
            if version_val == "all":
                collapse = None
            elif version_val.isnumeric():
                filter_spec.append({"term": {"version": int(version_val)}})
                collapse = None  # Don't collapse when filtering by specific version

        query = {"bool": {"filter": filter_spec}}
        sort = [{"version": {"order": "desc"}}]

        return self.query("map", query, collapse, sort, fields)

    def get_public_maps(
        self,
        map_id: str = None,
        fields: List[str] = None,
        filters: MapFilters = PublicMapFilters(),
        version: TerranovaVersion = None,
    ):
        """Get public maps"""
        return self.get_maps(map_id, fields, filters, version)

    def create_map(self, map_revision: MapRevision, user: User):
        """Create a new map"""
        map_id = self.generate_id()
        to_create = {
            "mapId": map_id,
            "name": map_revision.name,
            "version": 1,
            "configuration": map_revision.configuration,
            "overrides": map_revision.overrides,
            "lastUpdatedBy": user.username,
            "lastUpdatedOn": datetime.now().isoformat(),
            "public": False,
        }
        response = self.create("map", id=map_id, doc=Map(**to_create).model_dump())
        return {"result": response.get("result"), "object": to_create}

    def update_map(self, map_id: str, map_revision: MapRevision, user: User):
        """Update an existing map"""
        latest_map = self.get_maps(map_id=map_id)

        if len(latest_map) == 0:
            raise TerranovaNotFoundException("No map with id %s found" % map_id)

        latest_map = latest_map[0]

        new_map = {
            "mapId": map_id,
            "name": map_revision.name,
            "version": latest_map["version"] + 1,
            "configuration": map_revision.configuration,
            "lastUpdatedBy": user.username,
            "lastUpdatedOn": datetime.now().isoformat(),
            "overrides": map_revision.overrides,
            "public": latest_map.get("public", False),
        }
        response = self.create("map", id=self.generate_id(), doc=Map(**new_map).model_dump())
        output = {"result": response.get("result"), "object": new_map}
        return output

    def publish_map(self, map_id: str, user: User):
        """Publish a map (make it public)"""
        latest_map = self.get_maps(map_id=map_id)

        if len(latest_map) == 0:
            raise TerranovaNotFoundException("No map with id %s found" % map_id)

        latest_map = latest_map[0]

        new_map = latest_map.copy()
        new_map["public"] = True
        new_map["version"] = new_map["version"] + 1

        response = self.create("map", id=self.generate_id(), doc=Map(**new_map).model_dump())
        return {"result": response.get("result"), "object": new_map}

    # Datasets
    def get_datasets(
        self,
        dataset_id: str = None,
        fields: List[str] = None,
        filters: DatasetFilters = DatasetFilters(),
        version: TerranovaVersion = None,
    ) -> List[Dataset]:
        """Get datasets with optional filtering"""
        filter_spec = []
        if dataset_id is not None:
            filter_spec.append({"term": {"datasetId": dataset_id}})

        for term, value in filters.items():
            if value is not None and len(value) >= 1:
                filter_spec.append({"terms": {term: value}})

        # default for 'latest'
        collapse = {"field": "datasetId"}
        if version:
            version_val = str(version)
            if version_val == "all":
                collapse = None
            elif version_val.isnumeric():
                filter_spec.append({"term": {"version": int(version_val)}})
                collapse = None  # Don't collapse when filtering by specific version

        query = {"bool": {"filter": filter_spec}}
        sort = [{"version": {"order": "desc"}}]

        return self.query("dataset", query, collapse, sort, fields)

    def update_dataset(
        self,
        dataset_id: str,
        new_dataset: DatasetRevision,
        query_results: List[Any],
        user: User,
    ):
        """Update an existing dataset"""
        latest_dataset = self.get_datasets(dataset_id=dataset_id)

        if len(latest_dataset) == 0:
            raise TerranovaNotFoundException("No dataset with id %s found" % dataset_id)

        latest_dataset = latest_dataset[0]

        new_dataset = {
            "datasetId": dataset_id,
            "name": new_dataset.name,
            "version": latest_dataset["version"] + 1,
            "query": new_dataset.query,
            "results": query_results,
            "lastUpdatedBy": user.username,
            "lastUpdatedOn": datetime.now().isoformat(),
        }
        response = self.create(
            "dataset",
            id=self.generate_id(),
            doc=Dataset(**new_dataset).model_dump(),
        )
        output = {"result": response.get("result"), "object": new_dataset}
        return output

    def create_dataset(self, new_dataset: DatasetRevision, user: User):
        """Create a new dataset"""
        dataset_id = self.generate_id()
        dataset = {
            "datasetId": dataset_id,
            "name": new_dataset.name,
            "version": 1,
            "query": new_dataset.query,
            "lastUpdatedBy": user.username,
            "lastUpdatedOn": datetime.now().isoformat(),
            "results": None,
        }
        response = self.create("dataset", id=dataset_id, doc=Dataset(**dataset).model_dump())
        output = {"result": response.get("result"), "object": dataset}
        return output

    # Templates
    def get_templates(
        self,
        template_id: str = None,
        fields: List[str] = None,
        filters: TemplateFilters = TemplateFilters(),
        version: str = None,
    ) -> List[Template]:
        """Get templates with optional filtering"""
        filter_spec = []
        if template_id is not None:
            filter_spec.append({"term": {"templateId": template_id}})

        for term, value in filters.items():
            if value is not None and len(value) >= 1:
                filter_spec.append({"terms": {term: value}})

        # the default, version == "latest"
        collapse = {"field": "templateId"}
        if version == "all":
            collapse = None
        elif version is not None and version.isnumeric():
            filter_spec.append({"term": {"version": int(version)}})
            collapse = None  # Don't collapse when filtering by specific version

        query = {"bool": {"filter": filter_spec}}
        sort = [{"version": {"order": "desc"}}]

        return self.query("template", query, collapse, sort, fields)

    def create_template(self, new_template: NewTemplate, user: User):
        """Create a new template"""
        template_id = self.generate_id()
        template = {
            "templateId": template_id,
            "name": new_template.name,
            "version": 1,
            "template": new_template.template,
            "lastUpdatedBy": user.username,
            "lastUpdatedOn": datetime.now().isoformat(),
        }
        response = self.create("template", id=template_id, doc=Template(**template).model_dump())
        output = {"result": response.get("result"), "object": template}
        return output

    def update_template(self, template_id, new_template: NewTemplate, user: User):
        """Update an existing template"""
        current_template = self.get_templates(template_id=template_id)[0]
        new_template = {
            "templateId": current_template["templateId"],
            "name": new_template.name,
            "version": current_template["version"] + 1,
            "template": new_template.template,
            "lastUpdatedBy": user.username,
            "lastUpdatedOn": datetime.now().isoformat(),
        }
        response = self.create(
            "template",
            id=self.generate_id(),
            doc=Template(**new_template).model_dump(),
        )
        output = {"result": response.get("result"), "object": new_template}
        return output

    def is_connected(self):
        """Check if database connection is working"""
        try:
            cursor = self.conn.cursor()
            cursor.execute("SELECT 1")
            return True
        except Exception:
            return False

    def connection_info(self):
        """Get connection information"""
        return {
            "db_path": self.db_path,
            "sqlite_version": sqlite3.sqlite_version,
            "is_connected": self.is_connected(),
        }

    def create_indices(self):
        """Create database tables (equivalent to Elasticsearch indices)"""
        cursor = self.conn.cursor()

        # Create tables for each entity type
        tables = ["map", "dataset", "template", "userdata"]

        for table in tables:
            cursor.execute(f"""
                CREATE TABLE IF NOT EXISTS {table} (
                    id TEXT PRIMARY KEY,
                    document TEXT NOT NULL
                )
            """)

        self.conn.commit()

    def initialize_templates(self):
        """Initialize default templates if none exist"""
        if not self.get_templates():
            for name, template in INITIAL_TEMPLATES.items():
                class Dummy(object):
                    pass

                new_template = Dummy()
                new_template.name = name
                new_template.template = template

                user = Dummy()
                user.username = "admin"

                self.create_template(new_template, user)


# Note: Singleton instance is created in terranova.backends.storage when needed
# This is just a fallback for direct imports
backend = None
