import pytest
import tempfile
import os
from datetime import datetime
from terranova.backends.sqlite import SQLiteBackend
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


class TestSQLiteBackend:
    """Comprehensive tests for SQLiteBackend"""

    @pytest.fixture
    def backend(self):
        """Create a backend instance for testing with a temporary database"""
        # Use a temporary file for the database
        temp_fd, temp_path = tempfile.mkstemp(suffix=".db")
        os.close(temp_fd)

        backend = SQLiteBackend(db_path=temp_path)
        yield backend

        # Cleanup
        if hasattr(backend, '_local') and hasattr(backend._local, 'conn'):
            backend._local.conn.close()
        if os.path.exists(temp_path):
            os.remove(temp_path)

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
        temp_fd, temp_path = tempfile.mkstemp(suffix=".db")
        os.close(temp_fd)

        backend = SQLiteBackend(db_path=temp_path)
        assert backend.db_path == temp_path
        assert backend.is_connected()

        # Cleanup
        if hasattr(backend, '_local') and hasattr(backend._local, 'conn'):
            backend._local.conn.close()
        os.remove(temp_path)

    def test_init_memory(self):
        """Test backend initialization with in-memory database"""
        backend = SQLiteBackend(db_path=":memory:")
        assert backend.db_path == ":memory:"
        assert backend.is_connected()

    def test_create_success(self, backend):
        """Test successful document creation"""
        result = backend.create("map", "test-id", {"field": "value"})
        assert result["result"] == "created"
        assert result["id"] == "test-id"

    def test_update_success(self, backend):
        """Test successful document update"""
        backend.create("map", "test-id", {"field": "value"})
        result = backend.update("map", "test-id", {"field": "new_value"})
        assert result["result"] == "updated"

    def test_update_not_found(self, backend):
        """Test update of non-existent document"""
        with pytest.raises(TerranovaNotFoundException, match="Document with id : test-id not found"):
            backend.update("map", "test-id", {"field": "value"})

    def test_query_basic(self, backend):
        """Test basic querying"""
        backend.create("map", "id1", {"mapId": "map1", "name": "Test", "version": 1})
        backend.create("map", "id2", {"mapId": "map2", "name": "Test2", "version": 1})

        query = {"bool": {"filter": [{"term": {"mapId": "map1"}}]}}
        results = backend.query("map", query)

        assert len(results) == 1
        assert results[0]["mapId"] == "map1"

    def test_query_with_sort(self, backend):
        """Test querying with sorting"""
        backend.create("map", "id1", {"mapId": "map1", "version": 2})
        backend.create("map", "id2", {"mapId": "map2", "version": 1})

        query = {"bool": {"filter": []}}
        sort = [{"version": {"order": "desc"}}]
        results = backend.query("map", query, sort=sort)

        assert len(results) == 2
        assert results[0]["version"] == 2

    def test_query_with_collapse(self, backend):
        """Test querying with collapse"""
        backend.create("map", "id1", {"mapId": "map1", "version": 1})
        backend.create("map", "id2", {"mapId": "map1", "version": 2})

        query = {"bool": {"filter": []}}
        collapse = {"field": "mapId"}
        results = backend.query("map", query, collapse=collapse)

        assert len(results) == 1
        assert results[0]["version"] == 2

    def test_query_with_fields(self, backend):
        """Test querying with field filtering"""
        backend.create("map", "id1", {"mapId": "map1", "name": "Test", "version": 1})

        query = {"bool": {"filter": []}}
        results = backend.query("map", query, fields=["mapId", "name"])

        assert len(results) == 1
        assert "mapId" in results[0]
        assert "name" in results[0]
        assert "version" not in results[0]

    def test_query_with_limit(self, backend):
        """Test querying with limit"""
        for i in range(10):
            backend.create("map", f"id{i}", {"mapId": f"map{i}", "version": 1})

        query = {"bool": {"filter": []}}
        results = backend.query("map", query, limit=5)

        assert len(results) == 5

    def test_delete_by_query(self, backend):
        """Test delete by query"""
        backend.create("map", "map1", {"mapId": "map1", "status": "deleted", "version": 1})
        backend.create("map", "map2", {"mapId": "map2", "status": "active", "version": 1})

        query = {"bool": {"filter": [{"term": {"status": "deleted"}}]}}
        result = backend.delete_by_query("map", query, max_docs=1)

        assert result["deleted"] == 1

        # Verify deletion
        remaining = backend.query("map", {"bool": {"filter": []}})
        assert len(remaining) == 1
        assert remaining[0]["mapId"] == "map2"

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
    def test_get_userdata(self, backend, test_user):
        """Test getting user data"""
        userdata = {
            "username": "testuser",
            "favorites": {"maps": []},
            "lastEdited": {"maps": []}
        }
        backend.create("userdata", "testuser", userdata)

        result = backend.get_userdata(test_user)

        assert len(result) == 1
        assert result[0]["username"] == "testuser"

    def test_create_userdata(self, backend, test_user):
        """Test creating user data"""
        userdata = UserDataRevision(
            favorites={"maps": ["map1", "map2"]},
            lastEdited={"maps": ["map1"]}
        )

        result = backend.create_userdata(userdata, test_user)

        assert result["result"] == "created"
        assert result["object"]["username"] == "testuser"
        assert result["object"]["favorites"] == {"maps": ["map1", "map2"]}

    def test_update_userdata_success(self, backend, test_user):
        """Test updating existing user data"""
        # Create initial userdata
        userdata = UserDataRevision(
            favorites={"maps": []},
            lastEdited={"maps": []}
        )
        backend.create_userdata(userdata, test_user)

        # Update it
        updated_userdata = UserDataRevision(
            favorites={"maps": ["map1"]},
            lastEdited={"maps": ["map1"]}
        )
        result = backend.update_userdata(updated_userdata, test_user)

        assert result["result"] == "updated"
        assert result["object"]["favorites"] == {"maps": ["map1"]}

    def test_update_userdata_not_found(self, backend, test_user):
        """Test updating non-existent user data"""
        userdata = UserDataRevision(
            favorites={},
            lastEdited={}
        )

        with pytest.raises(TerranovaNotFoundException, match="Cannot find user data"):
            backend.update_userdata(userdata, test_user)

    # Map tests
    def test_get_maps(self, backend):
        """Test getting maps"""
        map_doc = {
            "mapId": "map1",
            "name": "Test Map",
            "version": 1,
            "configuration": {},
            "overrides": {},
            "lastUpdatedBy": "testuser",
            "lastUpdatedOn": datetime.now().isoformat(),
            "public": False
        }
        backend.create("map", "map1", map_doc)

        result = backend.get_maps(map_id="map1")

        assert len(result) == 1
        assert result[0]["mapId"] == "map1"

    def test_get_maps_with_filters(self, backend):
        """Test getting maps with filters"""
        map_doc = {
            "mapId": "map1",
            "name": "Test Map",
            "version": 1,
            "public": True,
            "configuration": {},
            "overrides": {},
            "lastUpdatedBy": "testuser",
            "lastUpdatedOn": datetime.now().isoformat()
        }
        backend.create("map", "map1", map_doc)

        filters = MapFilters(public=[True])
        result = backend.get_maps(filters=filters)

        assert len(result) == 1
        assert result[0]["public"] is True

    def test_get_maps_all_versions(self, backend):
        """Test getting all versions of maps"""
        backend.create("map", "id1", {"mapId": "map1", "version": 1, "name": "v1"})
        backend.create("map", "id2", {"mapId": "map1", "version": 2, "name": "v2"})

        result = backend.get_maps(version=TerranovaVersion(version="all"))

        assert len(result) == 2

    def test_get_maps_specific_version(self, backend):
        """Test getting specific version of maps"""
        backend.create("map", "id1", {"mapId": "map1", "version": 1, "name": "v1"})
        backend.create("map", "id2", {"mapId": "map1", "version": 2, "name": "v2"})

        result = backend.get_maps(version=TerranovaVersion(version="1"))

        assert len(result) == 1
        assert result[0]["version"] == 1

    def test_get_public_maps(self, backend):
        """Test getting public maps"""
        result = backend.get_public_maps(filters=PublicMapFilters())
        assert result == []

    def test_create_map(self, backend, test_user, test_map_configuration):
        """Test creating a new map"""
        map_revision = MapRevision(
            name="Test Map",
            configuration=test_map_configuration,
            overrides={},
        )

        result = backend.create_map(map_revision, test_user)

        assert result["result"] == "created"
        assert result["object"]["name"] == "Test Map"
        assert result["object"]["version"] == 1
        assert result["object"]["lastUpdatedBy"] == "testuser"
        assert "mapId" in result["object"]

    def test_update_map_success(self, backend, test_user, test_map_configuration):
        """Test updating an existing map"""
        # Create initial map
        map_revision = MapRevision(
            name="Old Name",
            configuration=test_map_configuration,
            overrides={},
        )
        create_result = backend.create_map(map_revision, test_user)
        map_id = create_result["object"]["mapId"]

        # Update it
        updated_revision = MapRevision(
            name="New Name",
            configuration=test_map_configuration,
            overrides={},
        )
        result = backend.update_map(map_id, updated_revision, test_user)

        assert result["result"] == "created"
        assert result["object"]["name"] == "New Name"
        assert result["object"]["version"] == 2
        assert result["object"]["mapId"] == map_id

    def test_update_map_not_found(self, backend, test_user, test_map_configuration):
        """Test updating non-existent map"""
        map_revision = MapRevision(
            name="Test",
            configuration=test_map_configuration,
            overrides={}
        )

        with pytest.raises(TerranovaNotFoundException, match="No map with id"):
            backend.update_map("nonexistent", map_revision, test_user)

    def test_publish_map_success(self, backend, test_user, test_map_configuration):
        """Test publishing a map"""
        # Create a map
        map_revision = MapRevision(
            name="Test Map",
            configuration=test_map_configuration,
            overrides={},
        )
        create_result = backend.create_map(map_revision, test_user)
        map_id = create_result["object"]["mapId"]

        # Publish it
        result = backend.publish_map(map_id, test_user)

        assert result["result"] == "created"
        assert result["object"]["public"] is True
        assert result["object"]["version"] == 2

    def test_publish_map_not_found(self, backend, test_user):
        """Test publishing non-existent map"""
        with pytest.raises(TerranovaNotFoundException, match="No map with id"):
            backend.publish_map("nonexistent", test_user)

    # Dataset tests
    def test_get_datasets(self, backend):
        """Test getting datasets"""
        dataset_doc = {
            "datasetId": "ds1",
            "name": "Test Dataset",
            "version": 1,
            "query": {},
            "results": None,
            "lastUpdatedBy": "testuser",
            "lastUpdatedOn": datetime.now().isoformat()
        }
        backend.create("dataset", "ds1", dataset_doc)

        result = backend.get_datasets(dataset_id="ds1")

        assert len(result) == 1
        assert result[0]["datasetId"] == "ds1"

    def test_get_datasets_with_filters(self, backend):
        """Test getting datasets with filters"""
        backend.create("dataset", "ds1", {
            "datasetId": "ds1",
            "name": "Dataset1",
            "version": 1
        })
        backend.create("dataset", "ds2", {
            "datasetId": "ds2",
            "name": "Dataset2",
            "version": 1
        })

        filters = DatasetFilters(name=["Dataset1"])
        result = backend.get_datasets(filters=filters)

        assert len(result) == 1
        assert result[0]["name"] == "Dataset1"

    def test_create_dataset(self, backend, test_user, test_dataset_query):
        """Test creating a new dataset"""
        dataset_revision = DatasetRevision(
            name="Test Dataset",
            query=test_dataset_query,
        )

        result = backend.create_dataset(dataset_revision, test_user)

        assert result["result"] == "created"
        assert result["object"]["name"] == "Test Dataset"
        assert result["object"]["version"] == 1
        assert "datasetId" in result["object"]

    def test_update_dataset_success(self, backend, test_user, test_dataset_query):
        """Test updating an existing dataset"""
        # Create initial dataset
        dataset_revision = DatasetRevision(
            name="Old Name",
            query=test_dataset_query,
        )
        create_result = backend.create_dataset(dataset_revision, test_user)
        dataset_id = create_result["object"]["datasetId"]

        # Update it
        updated_revision = DatasetRevision(
            name="New Name",
            query=test_dataset_query,
        )
        result = backend.update_dataset(dataset_id, updated_revision, [{"result": "data"}], test_user)

        assert result["result"] == "created"
        assert result["object"]["name"] == "New Name"
        assert result["object"]["version"] == 2
        assert result["object"]["results"] == [{"result": "data"}]

    def test_update_dataset_not_found(self, backend, test_user, test_dataset_query):
        """Test updating non-existent dataset"""
        dataset_revision = DatasetRevision(
            name="Test",
            query=test_dataset_query
        )

        with pytest.raises(TerranovaNotFoundException, match="No dataset with id"):
            backend.update_dataset("nonexistent", dataset_revision, [], test_user)

    # Template tests
    def test_get_templates(self, backend):
        """Test getting templates"""
        template_doc = {
            "templateId": "tmpl1",
            "name": "Test Template",
            "version": 1,
            "template": "<svg>...</svg>",
            "lastUpdatedBy": "testuser",
            "lastUpdatedOn": datetime.now().isoformat()
        }
        backend.create("template", "tmpl1", template_doc)

        result = backend.get_templates(template_id="tmpl1")

        assert len(result) == 1
        assert result[0]["templateId"] == "tmpl1"

    def test_get_templates_with_filters(self, backend):
        """Test getting templates with filters"""
        backend.create("template", "tmpl1", {
            "templateId": "tmpl1",
            "name": "Template1",
            "version": 1
        })
        backend.create("template", "tmpl2", {
            "templateId": "tmpl2",
            "name": "Template2",
            "version": 1
        })

        filters = TemplateFilters(name=["Template1"])
        result = backend.get_templates(filters=filters)

        assert len(result) == 1
        assert result[0]["name"] == "Template1"

    def test_get_templates_all_versions(self, backend):
        """Test getting all versions of templates"""
        backend.create("template", "id1", {"templateId": "tmpl1", "version": 1})
        backend.create("template", "id2", {"templateId": "tmpl1", "version": 2})

        result = backend.get_templates(version="all")

        assert len(result) == 2

    def test_get_templates_specific_version(self, backend):
        """Test getting specific version of templates"""
        backend.create("template", "id1", {"templateId": "tmpl1", "version": 1})
        backend.create("template", "id2", {"templateId": "tmpl1", "version": 2})

        result = backend.get_templates(version="1")

        assert len(result) == 1
        assert result[0]["version"] == 1

    def test_create_template(self, backend, test_user):
        """Test creating a new template"""
        new_template = NewTemplate(
            name="Test Template",
            template="<svg>...</svg>",
        )

        result = backend.create_template(new_template, test_user)

        assert result["result"] == "created"
        assert result["object"]["name"] == "Test Template"
        assert result["object"]["version"] == 1
        assert "templateId" in result["object"]

    def test_update_template_success(self, backend, test_user):
        """Test updating an existing template"""
        # Create initial template
        new_template = NewTemplate(
            name="Old Name",
            template="<svg>old</svg>",
        )
        create_result = backend.create_template(new_template, test_user)
        template_id = create_result["object"]["templateId"]

        # Update it
        updated_template = NewTemplate(
            name="New Name",
            template="<svg>new</svg>",
        )
        result = backend.update_template(template_id, updated_template, test_user)

        assert result["result"] == "created"
        assert result["object"]["name"] == "New Name"
        assert result["object"]["version"] == 2
        assert result["object"]["template"] == "<svg>new</svg>"

    # Connection tests
    def test_is_connected(self, backend):
        """Test connection check"""
        assert backend.is_connected() is True

    def test_connection_info(self, backend):
        """Test getting connection info"""
        result = backend.connection_info()

        assert "db_path" in result
        assert "sqlite_version" in result
        assert "is_connected" in result
        assert result["is_connected"] is True

    def test_create_indices(self, backend):
        """Test creating indices (tables)"""
        # Tables should already exist from init
        cursor = backend.conn.cursor()

        # Verify tables exist
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        tables = [row[0] for row in cursor.fetchall()]

        assert "map" in tables
        assert "dataset" in tables
        assert "template" in tables
        assert "userdata" in tables

    def test_initialize_templates(self, backend, test_user):
        """Test initializing default templates"""
        # Create a fresh backend without templates
        temp_fd, temp_path = tempfile.mkstemp(suffix=".db")
        os.close(temp_fd)

        fresh_backend = SQLiteBackend(db_path=temp_path)

        # Verify no templates exist
        templates_before = fresh_backend.get_templates()
        assert len(templates_before) == 0

        # Initialize templates
        fresh_backend.initialize_templates()

        # Verify templates were created
        templates_after = fresh_backend.get_templates(version="all")
        assert len(templates_after) > 0

        # Cleanup
        if hasattr(fresh_backend, '_local') and hasattr(fresh_backend._local, 'conn'):
            fresh_backend._local.conn.close()
        os.remove(temp_path)

    def test_initialize_templates_already_exist(self, backend, test_user):
        """Test that initialize_templates doesn't duplicate existing templates"""
        # Initialize templates once
        backend.initialize_templates()
        count_after_first = len(backend.get_templates(version="all"))

        # Call again
        backend.initialize_templates()
        count_after_second = len(backend.get_templates(version="all"))

        # Count should be the same
        assert count_after_first == count_after_second
