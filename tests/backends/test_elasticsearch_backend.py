import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime
import elasticsearch
from terranova.backends.elasticsearch import ElasticSearchBackend
from terranova.backends.auth import User
from terranova.models import (
    MapRevision,
    DatasetRevision,
    NewTemplate,
    UserDataRevision,
    MapFilters,
    PublicMapFilters,
    DatasetFilters,
    TemplateFilters,
    TerranovaNotFoundException,
    TerranovaVersion,
    MapConfiguration,
    MapOverrides,
    DatasetQuery,
    Viewport,
    ViewportCenter,
    TilesetConfiguration,
)
from terranova.abstract_models import QueryFilter


class TestElasticSearchBackend:
    """Comprehensive tests for ElasticSearchBackend"""

    @pytest.fixture
    def backend(self):
        """Create a backend instance for testing"""
        return ElasticSearchBackend(
            url="http://localhost:9200",
            user="test_user",
            password="test_pass",
            verify_certs=False,
        )

    @pytest.fixture
    def mock_es(self):
        """Mock Elasticsearch client"""
        return Mock()

    @pytest.fixture
    def test_user(self):
        """Create a test user"""
        return User(
            name="Test User",
            email="test@example.com",
            username="testuser",
            scope=["read", "write"]
        )

    @pytest.fixture
    def test_map_configuration(self):
        """Create a test MapConfiguration"""
        return MapConfiguration(
            initialViewStrategy="fitBounds",
            latitudeVar=None,
            longitudeVar=None,
            viewport=Viewport(
                center=ViewportCenter(lat=0.0, lng=0.0),
                top=None,
                left=None,
                bottom=None,
                right=None,
                zoom=None
            ),
            background="#000000",
            tileset=TilesetConfiguration(
                geographic=None,
                boundaries=None,
                labels=None
            ),
            editMode=False,
            showSidebar=True,
            showViewControls=True,
            showLegend=True,
            legendColumnLength=None,
            legendPosition=None,
            legendDefaultBehavior=None,
            enableScrolling=True,
            enableEditing=False,
            enableNodeAnimation=False,
            enableEdgeAnimation=False,
            thresholds=None,
            zIndexBase=0,
            layers=[]
        )

    @pytest.fixture
    def test_dataset_query(self):
        """Create a test DatasetQuery"""
        return DatasetQuery(
            endpoint="test-endpoint",
            filters=[],
            node_deduplication_field="location_name",
            node_group_criteria=None,
            node_group_layout=None
        )

    def test_init(self):
        """Test backend initialization"""
        backend = ElasticSearchBackend(
            url="http://test:9200",
            user="user",
            password="pass",
            verify_certs=True,
        )
        assert backend.url == "http://test:9200"
        assert backend.user == "user"
        assert backend.password == "pass"
        assert backend.verify_certs is True

    def test_es_property(self, backend):
        """Test Elasticsearch client property"""
        with patch("terranova.backends.elasticsearch.elasticsearch.Elasticsearch") as mock_es_class:
            es = backend.es
            mock_es_class.assert_called_once_with(
                backend.url,
                basic_auth=(backend.user, backend.password),
                verify_certs=backend.verify_certs,
                ssl_show_warn=False,
                request_timeout=5,
            )

    def test_create_success(self, backend, mock_es):
        """Test successful document creation"""
        mock_es.create.return_value = {"result": "created"}

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            result = backend.create("test-index", "test-id", {"field": "value"})

        mock_es.create.assert_called_once_with(
            index="test-index", id="test-id", document={"field": "value"}, refresh=True
        )
        assert result == {"result": "created"}

    def test_create_failure(self, backend, mock_es):
        """Test failed document creation"""
        mock_es.create.return_value = {"result": "failed"}

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            with pytest.raises(Exception, match="Unable to index document"):
                backend.create("test-index", "test-id", {"field": "value"})

    def test_update_success(self, backend, mock_es):
        """Test successful document update"""
        mock_es.update.return_value = {"result": "updated"}

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            result = backend.update("test-index", "test-id", {"field": "new_value"})

        mock_es.update.assert_called_once_with(
            index="test-index", id="test-id", body={"doc": {"field": "new_value"}}, refresh=True
        )
        assert result == {"result": "updated"}

    def test_update_not_found(self, backend, mock_es):
        """Test update of non-existent document"""
        mock_es.update.side_effect = elasticsearch.NotFoundError("Not found", {}, {})

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            with pytest.raises(TerranovaNotFoundException, match="Document with id : test-id not found"):
                backend.update("test-index", "test-id", {"field": "value"})

    def test_query(self, backend, mock_es):
        """Test querying documents"""
        mock_es.search.return_value = {
            "hits": {
                "hits": [
                    {"_source": {"field1": "value1"}},
                    {"_source": {"field2": "value2"}},
                ]
            }
        }

        query = {"bool": {"filter": [{"term": {"status": "active"}}]}}

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            result = backend.query("test-index", query, fields=["field1"], limit=100)

        mock_es.search.assert_called_once_with(
            index="test-index",
            query=query,
            collapse=None,
            sort=None,
            size=100,
            source=["field1"],
        )
        assert result == [{"field1": "value1"}, {"field2": "value2"}]

    def test_query_with_collapse_and_sort(self, backend, mock_es):
        """Test querying with collapse and sort parameters"""
        mock_es.search.return_value = {"hits": {"hits": []}}

        query = {"bool": {"filter": []}}
        collapse = {"field": "mapId"}
        sort = [{"version": {"order": "desc"}}]

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            backend.query("test-index", query, collapse=collapse, sort=sort)

        mock_es.search.assert_called_once_with(
            index="test-index", query=query, collapse=collapse, sort=sort, size=10000, source=None
        )

    def test_delete_by_query(self, backend, mock_es):
        """Test delete by query"""
        mock_es.delete_by_query.return_value = {"deleted": 1}

        query = {"term": {"status": "deleted"}}

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            result = backend.delete_by_query("test-index", query, max_docs=1)

        mock_es.delete_by_query.assert_called_once_with(
            index="test-index", query=query, max_docs=1
        )
        assert result == {"deleted": 1}

    def test_generate_id(self, backend):
        """Test ID generation"""
        id1 = backend.generate_id()
        id2 = backend.generate_id()

        assert len(id1) == 7
        assert len(id2) == 7
        assert id1 != id2
        assert id1.isalnum()
        assert id2.isalnum()

    # UserData tests
    def test_get_userdata(self, backend, mock_es, test_user):
        """Test getting user data"""
        mock_es.search.return_value = {
            "hits": {"hits": [{"_source": {"username": "testuser", "favorites": []}}]}
        }

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            with patch("terranova.backends.elasticsearch.ELASTIC_INDICES", {"userdata": {"read": "test-userdata"}}):
                result = backend.get_userdata(test_user)

        assert len(result) == 1
        assert result[0]["username"] == "testuser"

    def test_create_userdata(self, backend, mock_es, test_user):
        """Test creating user data"""
        mock_es.create.return_value = {"result": "created"}

        userdata = UserDataRevision(
            favorites={"maps": ["map1", "map2"]},
            lastEdited={"maps": ["map1"]}
        )

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            with patch("terranova.backends.elasticsearch.ELASTIC_INDICES", {"userdata": {"write": "test-userdata"}}):
                result = backend.create_userdata(userdata, test_user)

        assert result["result"] == "created"
        assert result["object"]["username"] == "testuser"
        assert result["object"]["favorites"] == {"maps": ["map1", "map2"]}

    def test_update_userdata_success(self, backend, mock_es, test_user):
        """Test updating existing user data"""
        mock_es.search.return_value = {
            "hits": {"hits": [{"_source": {"username": "testuser", "favorites": {}}}]}
        }
        mock_es.update.return_value = {"result": "updated"}

        userdata = UserDataRevision(
            favorites={"maps": ["map1"]},
            lastEdited={"maps": ["map1"]}
        )

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            with patch("terranova.backends.elasticsearch.ELASTIC_INDICES", {
                "userdata": {"read": "test-userdata", "write": "test-userdata"}
            }):
                result = backend.update_userdata(userdata, test_user)

        assert result["result"] == "updated"
        assert result["object"]["favorites"] == {"maps": ["map1"]}

    def test_update_userdata_not_found(self, backend, mock_es, test_user):
        """Test updating non-existent user data"""
        mock_es.search.return_value = {"hits": {"hits": []}}

        userdata = UserDataRevision(
            favorites={},
            lastEdited={}
        )

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            with patch("terranova.backends.elasticsearch.ELASTIC_INDICES", {"userdata": {"read": "test-userdata"}}):
                with pytest.raises(TerranovaNotFoundException, match="Cannot find user data"):
                    backend.update_userdata(userdata, test_user)

    # Map tests
    def test_get_maps(self, backend, mock_es):
        """Test getting maps"""
        mock_es.search.return_value = {
            "hits": {
                "hits": [
                    {"_source": {"mapId": "map1", "name": "Test Map", "version": 1}}
                ]
            }
        }

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            with patch("terranova.backends.elasticsearch.ELASTIC_INDICES", {"map": {"read": "test-map"}}):
                result = backend.get_maps(map_id="map1")

        assert len(result) == 1
        assert result[0]["mapId"] == "map1"

    def test_get_maps_with_filters(self, backend, mock_es):
        """Test getting maps with filters"""
        mock_es.search.return_value = {"hits": {"hits": []}}

        filters = MapFilters(public=[True])

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            with patch("terranova.backends.elasticsearch.ELASTIC_INDICES", {"map": {"read": "test-map"}}):
                backend.get_maps(filters=filters)

        # Verify the filter was applied (public=[True] becomes a terms filter)
        call_args = mock_es.search.call_args
        query = call_args.kwargs["query"]
        assert any(
            filter_item.get("terms", {}).get("public") == [True]
            for filter_item in query["bool"]["filter"]
        )

    def test_get_maps_all_versions(self, backend, mock_es):
        """Test getting all versions of maps"""
        mock_es.search.return_value = {"hits": {"hits": []}}

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            with patch("terranova.backends.elasticsearch.ELASTIC_INDICES", {"map": {"read": "test-map"}}):
                backend.get_maps(version=TerranovaVersion(version="all"))

        # Verify collapse is None for all versions
        call_args = mock_es.search.call_args
        assert call_args.kwargs["collapse"] is None

    def test_get_maps_specific_version(self, backend, mock_es):
        """Test getting specific version of maps"""
        mock_es.search.return_value = {"hits": {"hits": []}}

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            with patch("terranova.backends.elasticsearch.ELASTIC_INDICES", {"map": {"read": "test-map"}}):
                backend.get_maps(version=TerranovaVersion(version="2"))

        # Verify version filter was applied
        call_args = mock_es.search.call_args
        query = call_args.kwargs["query"]
        assert any(
            filter_item.get("term", {}).get("version") == "2"
            for filter_item in query["bool"]["filter"]
        )

    def test_get_public_maps(self, backend, mock_es):
        """Test getting public maps"""
        mock_es.search.return_value = {"hits": {"hits": []}}

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            with patch("terranova.backends.elasticsearch.ELASTIC_INDICES", {"map": {"read": "test-map"}}):
                result = backend.get_public_maps(filters=PublicMapFilters())

        assert result == []

    def test_create_map(self, backend, mock_es, test_user, test_map_configuration):
        """Test creating a new map"""
        mock_es.create.return_value = {"result": "created"}

        map_revision = MapRevision(
            name="Test Map",
            configuration=test_map_configuration,
            overrides={},
        )

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            with patch("terranova.backends.elasticsearch.ELASTIC_INDICES", {"map": {"write": "test-map"}}):
                result = backend.create_map(map_revision, test_user)

        assert result["result"] == "created"
        assert result["object"]["name"] == "Test Map"
        assert result["object"]["version"] == 1
        assert result["object"]["lastUpdatedBy"] == "testuser"
        assert "mapId" in result["object"]

    def test_update_map_success(self, backend, mock_es, test_user, test_map_configuration):
        """Test updating an existing map"""
        mock_es.search.return_value = {
            "hits": {
                "hits": [
                    {"_source": {"mapId": "map1", "name": "Old Name", "version": 1}}
                ]
            }
        }
        mock_es.create.return_value = {"result": "created"}

        map_revision = MapRevision(
            name="New Name",
            configuration=test_map_configuration,
            overrides={},
        )

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            with patch("terranova.backends.elasticsearch.ELASTIC_INDICES", {
                "map": {"read": "test-map", "write": "test-map"}
            }):
                result = backend.update_map("map1", map_revision, test_user)

        assert result["result"] == "created"
        assert result["object"]["name"] == "New Name"
        assert result["object"]["version"] == 2
        assert result["object"]["mapId"] == "map1"

    def test_update_map_not_found(self, backend, mock_es, test_user, test_map_configuration):
        """Test updating non-existent map"""
        mock_es.search.return_value = {"hits": {"hits": []}}

        map_revision = MapRevision(
            name="Test",
            configuration=test_map_configuration,
            overrides={}
        )

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            with patch("terranova.backends.elasticsearch.ELASTIC_INDICES", {"map": {"read": "test-map"}}):
                with pytest.raises(TerranovaNotFoundException, match="No map with id"):
                    backend.update_map("nonexistent", map_revision, test_user)

    def test_publish_map_success(self, backend, mock_es, test_user, test_map_configuration):
        """Test publishing a map"""
        mock_es.search.return_value = {
            "hits": {
                "hits": [
                    {
                        "_source": {
                            "mapId": "map1",
                            "name": "Test Map",
                            "version": 1,
                            "public": False,
                            "configuration": test_map_configuration.model_dump(),
                            "overrides": {},
                            "lastUpdatedBy": "testuser",
                            "lastUpdatedOn": "2026-01-01T00:00:00Z",
                        }
                    }
                ]
            }
        }
        mock_es.create.return_value = {"result": "created"}

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            with patch("terranova.backends.elasticsearch.ELASTIC_INDICES", {
                "map": {"read": "test-map", "write": "test-map"}
            }):
                result = backend.publish_map("map1", test_user)

        assert result["result"] == "created"
        assert result["object"]["public"] is True
        assert result["object"]["version"] == 2

    def test_publish_map_not_found(self, backend, mock_es, test_user):
        """Test publishing non-existent map"""
        mock_es.search.return_value = {"hits": {"hits": []}}

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            with patch("terranova.backends.elasticsearch.ELASTIC_INDICES", {"map": {"read": "test-map"}}):
                with pytest.raises(TerranovaNotFoundException, match="No map with id"):
                    backend.publish_map("nonexistent", test_user)

    # Dataset tests
    def test_get_datasets(self, backend, mock_es):
        """Test getting datasets"""
        mock_es.search.return_value = {
            "hits": {
                "hits": [
                    {"_source": {"datasetId": "ds1", "name": "Test Dataset", "version": 1}}
                ]
            }
        }

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            with patch("terranova.backends.elasticsearch.ELASTIC_INDICES", {"dataset": {"read": "test-dataset"}}):
                result = backend.get_datasets(dataset_id="ds1")

        assert len(result) == 1
        assert result[0]["datasetId"] == "ds1"

    def test_get_datasets_with_filters(self, backend, mock_es):
        """Test getting datasets with filters"""
        mock_es.search.return_value = {"hits": {"hits": []}}

        filters = DatasetFilters(name=["Dataset1", "Dataset2"])

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            with patch("terranova.backends.elasticsearch.ELASTIC_INDICES", {"dataset": {"read": "test-dataset"}}):
                backend.get_datasets(filters=filters)

        call_args = mock_es.search.call_args
        query = call_args.kwargs["query"]
        assert any(
            "terms" in filter_item and "name" in filter_item["terms"]
            for filter_item in query["bool"]["filter"]
        )

    def test_create_dataset(self, backend, mock_es, test_user, test_dataset_query):
        """Test creating a new dataset"""
        mock_es.create.return_value = {"result": "created"}

        dataset_revision = DatasetRevision(
            name="Test Dataset",
            query=test_dataset_query,
        )

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            with patch("terranova.backends.elasticsearch.ELASTIC_INDICES", {"dataset": {"write": "test-dataset"}}):
                result = backend.create_dataset(dataset_revision, test_user)

        assert result["result"] == "created"
        assert result["object"]["name"] == "Test Dataset"
        assert result["object"]["version"] == 1
        assert "datasetId" in result["object"]

    def test_update_dataset_success(self, backend, mock_es, test_user, test_dataset_query):
        """Test updating an existing dataset"""
        mock_es.search.return_value = {
            "hits": {
                "hits": [
                    {"_source": {"datasetId": "ds1", "name": "Old Name", "version": 1}}
                ]
            }
        }
        mock_es.create.return_value = {"result": "created"}

        dataset_revision = DatasetRevision(
            name="New Name",
            query=test_dataset_query,
        )

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            with patch("terranova.backends.elasticsearch.ELASTIC_INDICES", {
                "dataset": {"read": "test-dataset", "write": "test-dataset"}
            }):
                result = backend.update_dataset("ds1", dataset_revision, [{"result": "data"}], test_user)

        assert result["result"] == "created"
        assert result["object"]["name"] == "New Name"
        assert result["object"]["version"] == 2
        assert result["object"]["results"] == [{"result": "data"}]

    def test_update_dataset_not_found(self, backend, mock_es, test_user, test_dataset_query):
        """Test updating non-existent dataset"""
        mock_es.search.return_value = {"hits": {"hits": []}}

        dataset_revision = DatasetRevision(
            name="Test",
            query=test_dataset_query
        )

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            with patch("terranova.backends.elasticsearch.ELASTIC_INDICES", {"dataset": {"read": "test-dataset"}}):
                with pytest.raises(TerranovaNotFoundException, match="No dataset with id"):
                    backend.update_dataset("nonexistent", dataset_revision, [], test_user)

    # Template tests
    def test_get_templates(self, backend, mock_es):
        """Test getting templates"""
        mock_es.search.return_value = {
            "hits": {
                "hits": [
                    {"_source": {"templateId": "tmpl1", "name": "Test Template", "version": 1}}
                ]
            }
        }

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            with patch("terranova.backends.elasticsearch.ELASTIC_INDICES", {"template": {"read": "test-template"}}):
                result = backend.get_templates(template_id="tmpl1")

        assert len(result) == 1
        assert result[0]["templateId"] == "tmpl1"

    def test_get_templates_with_filters(self, backend, mock_es):
        """Test getting templates with filters"""
        mock_es.search.return_value = {"hits": {"hits": []}}

        filters = TemplateFilters(name=["Template1"])

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            with patch("terranova.backends.elasticsearch.ELASTIC_INDICES", {"template": {"read": "test-template"}}):
                backend.get_templates(filters=filters)

        call_args = mock_es.search.call_args
        query = call_args.kwargs["query"]
        assert len(query["bool"]["filter"]) > 0

    def test_get_templates_all_versions(self, backend, mock_es):
        """Test getting all versions of templates"""
        mock_es.search.return_value = {"hits": {"hits": []}}

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            with patch("terranova.backends.elasticsearch.ELASTIC_INDICES", {"template": {"read": "test-template"}}):
                backend.get_templates(version="all")

        call_args = mock_es.search.call_args
        assert call_args.kwargs["collapse"] is None

    def test_get_templates_specific_version(self, backend, mock_es):
        """Test getting specific version of templates"""
        mock_es.search.return_value = {"hits": {"hits": []}}

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            with patch("terranova.backends.elasticsearch.ELASTIC_INDICES", {"template": {"read": "test-template"}}):
                backend.get_templates(version="2")

        call_args = mock_es.search.call_args
        query = call_args.kwargs["query"]
        assert any(
            filter_item.get("term", {}).get("version") == "2"
            for filter_item in query["bool"]["filter"]
        )

    def test_create_template(self, backend, mock_es, test_user):
        """Test creating a new template"""
        mock_es.create.return_value = {"result": "created"}

        new_template = NewTemplate(
            name="Test Template",
            template="<svg>...</svg>",
        )

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            with patch("terranova.backends.elasticsearch.ELASTIC_INDICES", {"template": {"write": "test-template"}}):
                result = backend.create_template(new_template, test_user)

        assert result["result"] == "created"
        assert result["object"]["name"] == "Test Template"
        assert result["object"]["version"] == 1
        assert "templateId" in result["object"]

    def test_update_template_success(self, backend, mock_es, test_user):
        """Test updating an existing template"""
        mock_es.search.return_value = {
            "hits": {
                "hits": [
                    {
                        "_source": {
                            "templateId": "tmpl1",
                            "name": "Old Name",
                            "version": 1,
                            "template": "<svg>old</svg>",
                        }
                    }
                ]
            }
        }
        mock_es.create.return_value = {"result": "created"}

        new_template = NewTemplate(
            name="New Name",
            template="<svg>new</svg>",
        )

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            with patch("terranova.backends.elasticsearch.ELASTIC_INDICES", {
                "template": {"read": "test-template", "write": "test-template"}
            }):
                result = backend.update_template("tmpl1", new_template, test_user)

        assert result["result"] == "created"
        assert result["object"]["name"] == "New Name"
        assert result["object"]["version"] == 2
        assert result["object"]["template"] == "<svg>new</svg>"

    # Connection tests
    def test_is_connected(self, backend, mock_es):
        """Test connection check"""
        mock_es.ping.return_value = True

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            assert backend.is_connected() is True

        mock_es.ping.return_value = False

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            assert backend.is_connected() is False

    def test_connection_info(self, backend, mock_es):
        """Test getting connection info"""
        mock_info = {"version": {"number": "8.6.0"}}
        mock_es.info.return_value = mock_info

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            result = backend.connection_info()

        assert result == mock_info

    def test_create_indices(self, backend, mock_es):
        """Test creating indices"""
        mock_es.indices.exists.return_value = False

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            with patch("terranova.backends.elasticsearch.CREATE_STATEMENTS", {
                "test-index": {"name": "test-template", "index_patterns": ["test-*"]}
            }):
                backend.create_indices()

        # Should create template and index
        assert mock_es.indices.put_index_template.called
        assert mock_es.indices.create.called

    def test_create_indices_already_exists(self, backend, mock_es):
        """Test creating indices that already exist"""
        mock_es.indices.exists.return_value = True

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            with patch("terranova.backends.elasticsearch.CREATE_STATEMENTS", {
                "test-index": {"name": "test-template", "index_patterns": ["test-*"]}
            }):
                backend.create_indices()

        # Should not create if already exists
        assert not mock_es.indices.put_index_template.called
        assert not mock_es.indices.create.called

    def test_create_indices_authorization_exception(self, backend, mock_es):
        """Test creating indices with authorization exception"""
        mock_es.indices.exists.side_effect = elasticsearch.AuthorizationException("Unauthorized", {}, {})

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            with patch("terranova.backends.elasticsearch.CREATE_STATEMENTS", {
                "test-index": {"name": "test-template", "index_patterns": ["test-*"]}
            }):
                backend.create_indices()

        # Should still try to create
        assert mock_es.indices.put_index_template.called
        assert mock_es.indices.create.called

    def test_initialize_templates_empty(self, backend, mock_es, test_user):
        """Test initializing templates when none exist"""
        mock_es.search.return_value = {"hits": {"hits": []}}
        mock_es.create.return_value = {"result": "created"}

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            with patch("terranova.backends.elasticsearch.ELASTIC_INDICES", {"template": {"read": "test-template", "write": "test-template"}}):
                with patch("terranova.backends.elasticsearch.INITIAL_TEMPLATES", {"Template1": "<svg>test</svg>"}):
                    backend.initialize_templates()

        # Should create initial templates
        assert mock_es.create.called

    def test_initialize_templates_already_exist(self, backend, mock_es):
        """Test initializing templates when they already exist"""
        mock_es.search.return_value = {
            "hits": {"hits": [{"_source": {"name": "Existing"}}]}
        }

        with patch.object(type(backend), 'es', property(lambda self: mock_es)):
            with patch("terranova.backends.elasticsearch.ELASTIC_INDICES", {"template": {"read": "test-template"}}):
                backend.initialize_templates()

        # Should not create if templates already exist
        assert not mock_es.create.called
