from terranova.logging import logger
import pytest

# This allows us to test the /types/ API endpoint with various
# queries along with the number of expected results for each
# Everything in models.filter_args should be expressed here
type_tests = [
    # the first set are without any filters
    ("circuit_type_name", 5),
    ("circuit_state_name", 2),
    ("location_tags", 9),
    ("endpoints_location_name", 11),
    ("endpoints_device_name", 4),
    ("description", 5),
    ("circuit_id", 7),
    ("orchestrator_id", 0),
    ("customer_of_record_name", 3),
    # these are getting unique type values with filters
    ("circuit_type_name?circuit_type_name=Equipment-Equipment", 1),
    ("circuit_type_name?circuit_type_name=Equipment-Equipment&circuit_type_name=Dark Fiber", 2),
    # the "endpoints" fields are handled specially in the code on account of being
    # arrays, so we want to make sure that works well
    ("endpoints_location_name?circuit_state_name=In-service", 10),
    ("endpoints_location_name?endpoints_location_name=CHIC-HUB", 2),
    ("endpoints_location_name?endpoints_location_name_like=DOESNOTEXIST", 0),
    ("location_tags?circuit_type_name=Equipment-Equipment", 2),
    ("location_tags?endpoints_location_name=CHIC-HUB", 1),
    # test some of the logic filters
    ("circuit_type_name?circuit_type_name_like=Fiber", 1),
    ("circuit_type_name?circuit_type_name_not_like=Fiber", 4),
    # test some combinations
    ("circuit_type_name?circuit_type_name_not_like=ane&circuit_type_name_like=Panel", 0),
    ("circuit_type_name?circuit_type_name_like=ane&circuit_type_name_like=Panel", 2),
]


@pytest.mark.parametrize("query,expected", type_tests)
def test_unique_types(client, query, expected, readonly_jwt):

    full_url = "/types/%s" % (query)
    response = client.get(full_url, headers={"Authorization": "Bearer %s" % readonly_jwt})
    assert response.status_code == 200

    types = response.json()
    logger.debug("%s => %s" % (full_url, types))
    assert isinstance(types, list) and len(types) == expected


# These tests are designed to make sure that equality matches only let you put in values
# that are possible to succeed. ie if I don't have a circuit type of "NOTEXISTS" then it
# should be considered bad input vs just returning an empty array
bad_inputs = [
    "circuit_type_name?circuit_type_name=NOTEXISTS",
    "circuit_type_name?circuit_type_name_not_equal=NOTEXISTS",
    # make sure the "array" fields are handled as well
    "endpoints_location_name?endpoints_location_name=DOESNOTEXIST",
    "location_tags?location_tags=DOESNOTEXIST",
]


@pytest.mark.parametrize("query", bad_inputs)
def test_bad_inputs(client, query, readonly_jwt):

    full_url = "/types/%s" % (query)
    response = client.get(full_url, headers={"Authorization": "Bearer %s" % readonly_jwt})
    assert response.status_code == 400

    content = response.json()
    logger.debug("%s => %s" % (full_url, content))
    assert "Value must be one of" in content["detail"]
