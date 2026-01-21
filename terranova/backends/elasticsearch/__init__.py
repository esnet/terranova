import elasticsearch
import secrets
import string
from terranova.settings import ELASTIC_URL, ELASTIC_USER, ELASTIC_PASS, ELASTIC_INDICES
from .constants import CREATE_STATEMENTS, INITIAL_TEMPLATES
from terranova.backends.auth import User
from terranova.models import (
    Dataset,
    Map,
    Template,
    # DatasetQuery,
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
    # VersionEnum,
    TerranovaVersion,
)
from datetime import datetime
from typing import List, Any


class ElasticSearchBackend:
    """
    This class is intended as a relatively thin layer around the ES driver and provides
    basic connectivity to an Elastic instance
    """

    def __init__(
        self,
        url=ELASTIC_URL,
        user=ELASTIC_USER,
        password=ELASTIC_PASS,
        verify_certs=False,
    ):
        self.url = url
        self.user = user
        self.password = password
        self.verify_certs = verify_certs

    @property
    def es(self):
        return elasticsearch.Elasticsearch(
            self.url,
            basic_auth=(self.user, self.password),
            verify_certs=self.verify_certs,
            ssl_show_warn=False,
            request_timeout=5,
        )

    # General ES functions
    def create(self, index: str, id: str, doc: dict):
        # verify doc here? or is that higher level
        # refresh=True is *important* below -- guarantees that the document
        # is readable after being written -- this is not available on `index()`
        res = self.es.create(index=index, id=id, document=doc, refresh=True)
        if res["result"] not in ["created", "updated"]:
            raise Exception("Unable to index document in Elasticsearch: %s" % res)
        return res

    def update(self, index: str, id: str, doc: dict):
        try:
            return self.es.update(index=index, id=id, body={"doc": doc}, refresh=True)
        except elasticsearch.NotFoundError:
            raise TerranovaNotFoundException("Document with id : %s not found" % id)

    def query(
        self,
        index: str,
        query: dict,
        collapse: dict = None,
        sort: List[dict] = None,
        fields: List[str] = None,
        limit: int = 10000,
    ):
        query_result = self.es.search(
            index=index, query=query, collapse=collapse, sort=sort, size=limit, source=fields
        )
        result = []
        for res in query_result["hits"]["hits"]:
            result.append(res["_source"])

        return result

    def delete_by_query(self, index, query, max_docs=1):
        query_result = self.es.delete_by_query(index=index, query=query, max_docs=1)
        return query_result

    def generate_id(self):
        # Create 7 character alphanumeric string
        alphabet = string.ascii_letters + string.digits
        id = "".join(secrets.choice(alphabet) for i in range(7))
        return id

    # User Data

    def get_userdata(self, user: User):
        filter = {"term": {"username": user.username}}
        query = {"bool": {"filter": filter}}
        return self.query(ELASTIC_INDICES["userdata"]["read"], query)

    def create_userdata(self, userdata: UserDataRevision, user: User):
        to_create = {
            "username": user.username,
            "favorites": userdata.favorites,
            "lastEdited": userdata.lastEdited,
        }
        response = self.create(
            ELASTIC_INDICES["userdata"]["write"],
            id=user.username,
            doc=UserData(**to_create).model_dump(),
        )
        output = {"result": response.get("result"), "object": to_create}
        return output

    def update_userdata(self, userdata: UserDataRevision, user: User):
        # can't update userdata for a user that doesn't exist
        existing_user = self.get_userdata(user)

        if len(existing_user) == 0:
            raise TerranovaNotFoundException("Cannot find user data for %s" % user.username)

        to_update = {
            "username": user.username,
            "favorites": userdata.favorites,
            "lastEdited": userdata.lastEdited,
        }
        response = self.update(
            ELASTIC_INDICES["userdata"]["write"],
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
        # Based on the map_id, this returns the latest version of each document
        filter_spec = []
        if map_id is not None:
            filter = {"term": {"mapId": map_id}}
            filter_spec.append(filter)

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
                filter_spec.append({"term": {"version": version_val}})

        query = {"bool": {"filter": filter_spec}}
        sort = [{"version": {"order": "desc"}}]

        return self.query(ELASTIC_INDICES["map"]["read"], query, collapse, sort, fields)

    # Public Maps
    def get_public_maps(
        self,
        map_id: str = None,
        fields: List[str] = None,
        filters: MapFilters = PublicMapFilters(),
        version: TerranovaVersion = None,
    ):
        return self.get_maps(map_id, fields, filters, version)

    def create_map(self, map_revision: MapRevision, user: User):
        map_id = self.generate_id()
        to_create = {
            "mapId": map_id,
            "name": map_revision.name,
            "version": 1,
            "configuration": map_revision.configuration,
            "overrides": map_revision.overrides,
            "lastUpdatedBy": user.username,
            "lastUpdatedOn": datetime.now().isoformat(),
        }
        response = self.create(
            ELASTIC_INDICES["map"]["write"], id=map_id, doc=Map(**to_create).model_dump()
        )
        return {"result": response.get("result"), "object": to_create}

    def update_map(self, map_id: str, map_revision: MapRevision, user: User):
        latest_map = self.get_maps(map_id=map_id)

        # can't update a map that doesn't exist
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
        }
        response = self.create(
            ELASTIC_INDICES["map"]["write"], id=self.generate_id(), doc=Map(**new_map).model_dump()
        )
        output = {"result": response.get("result"), "object": new_map}
        return output

    def publish_map(self, map_id: str, user: User):
        latest_map = self.get_maps(map_id=map_id)

        # can't update a map that doesn't exist
        if len(latest_map) == 0:
            raise TerranovaNotFoundException("No map with id %s found" % map_id)

        latest_map = latest_map[0]

        new_map = latest_map
        new_map["public"] = True
        new_map["version"] = new_map["version"] + 1

        response = self.create(
            ELASTIC_INDICES["map"]["write"], id=self.generate_id(), doc=Map(**new_map).model_dump()
        )
        return {"result": response.get("result"), "object": new_map}

    # Datasets

    def get_datasets(
        self,
        dataset_id: str = None,
        fields: List[str] = None,
        filters: DatasetFilters = DatasetFilters(),
        version: TerranovaVersion = None,
    ) -> List[Dataset]:
        # Based on the dataset_id, this returns the latest version of each document
        filter_spec = []
        if dataset_id is not None:
            filter = {"term": {"datasetId": dataset_id}}
            filter_spec.append(filter)

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
                filter_spec.append({"term": {"version": version_val}})

        query = {"bool": {"filter": filter_spec}}
        sort = [{"version": {"order": "desc"}}]

        return self.query(ELASTIC_INDICES["dataset"]["read"], query, collapse, sort, fields)

    def update_dataset(
        self,
        dataset_id: str,
        new_dataset: DatasetRevision,
        query_results: List[Any],
        user: User,
    ):
        latest_dataset = self.get_datasets(dataset_id=dataset_id)

        # can't update a dataset that doesn't exist
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
            ELASTIC_INDICES["dataset"]["write"],
            id=self.generate_id(),
            doc=Dataset(**new_dataset).model_dump(),
        )
        output = {"result": response.get("result"), "object": new_dataset}
        return output

    def create_dataset(self, new_dataset: DatasetRevision, user: User):
        dataset_id = self.generate_id()
        dataset = {
            "datasetId": dataset_id,
            "name": new_dataset.name,
            "version": 1,
            "query": new_dataset.query,
            "lastUpdatedBy": user.username,
            "lastUpdatedOn": datetime.now().isoformat(),
        }
        response = self.create(
            ELASTIC_INDICES["dataset"]["write"], id=dataset_id, doc=Dataset(**dataset).model_dump()
        )
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

        # Based on the template_id, this returns the latest version of each document
        filter_spec = []
        if template_id is not None:
            filter = {"term": {"templateId": template_id}}
            filter_spec.append(filter)

        for term, value in filters.items():
            if value is not None and len(value) >= 1:
                filter_spec.append({"terms": {term: value}})

        # the default, version == "latest"
        collapse = {"field": "templateId"}
        if version == "all":
            collapse = None
        if version is not None and version.isnumeric():
            filter_spec.append({"term": {"version": version}})

        query = {"bool": {"filter": filter_spec}}
        sort = [{"version": {"order": "desc"}}]

        return self.query(ELASTIC_INDICES["template"]["read"], query, collapse, sort, fields)

    def create_template(self, new_template: NewTemplate, user: User):
        template_id = self.generate_id()
        template = {
            "templateId": template_id,
            "name": new_template.name,
            "version": 1,
            "template": new_template.template,
            "lastUpdatedBy": user.username,
            "lastUpdatedOn": datetime.now().isoformat(),
        }
        response = self.create(
            ELASTIC_INDICES["template"]["write"], id=template_id, doc=Template(**template).model_dump()
        )
        output = {"result": response.get("result"), "object": template}
        return output

    def update_template(self, template_id, new_template: NewTemplate, user: User):
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
            ELASTIC_INDICES["template"]["write"],
            id=self.generate_id(),
            doc=Template(**new_template).model_dump(),
        )
        output = {"result": response.get("result"), "object": new_template}
        return output

    def is_connected(self):
        return self.es.ping()

    def connection_info(self):
        return self.es.info()

    def create_indices(self):
        for index, create_parameters in CREATE_STATEMENTS.items():
            try:
                exists = self.es.indices.exists(index=index)
            except elasticsearch.AuthorizationException:
                self.es.indices.put_index_template(**create_parameters)
                self.es.indices.create(index=index)
            if not exists:
                self.es.indices.put_index_template(**create_parameters)
                self.es.indices.create(index=index)

    def initialize_templates(self):
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


backend = ElasticSearchBackend()
