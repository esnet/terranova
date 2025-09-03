import pytest
from terranova.models import DatasetRevision, DatasetQuery

@pytest.fixture
def dataset_revision():
    query = DatasetQuery(endpoint="terranova",
                         filters=[{
                                  "field": "circuit_state_name",
                                  "operator": "not_like",
                                  "value": [
                                    "Equipment-Equipment"
                                  ]
                                 }
                                 ])

    return DatasetRevision(name="TestDataSet",
                           query=query)
