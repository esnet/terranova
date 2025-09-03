from terranova.logging import logger
import pytest

# Test getting sets of circuits with combinations of various filters.
# Under the hood this uses the same query building logic as the "types" calls
filters = [
    ("circuit_state_name=In-service", 6),
    ("circuit_state_name=In-service&circuit_type_name=Dark Fiber", 2),
    ("circuit_state_name=In-service&circuit_type_name_not_equal=Dark Fiber", 4),
    ("endpoints_location_name=CHIC-HUB", 1),
    ("endpoints_location_name=CHIC-HUB&circuit_state_name=In-service", 1),
    ("endpoints_location_name=CHIC-HUB&circuit_state_name=Planning", 0),
    ("endpoints_location_name_like=EQX", 2),
    ("endpoints_location_name_like=EQX&customer_of_record_name=DOE-NNSA-ALBQ", 0),
    ("location_tags=ESnet5", 3),
    ("location_tags=ESnet6", 4),
    ("location_tags=ESnet5&location_tags=ESnet6", 7),
    ("customer_of_record_name=DOE-NNSA-ALBQ", 1),
    ("circuit_speed_name=40G", 1),
    ("circuit_speed_name_not_like=40", 3),
    ("circuit_speed_name_like=40&customer_of_record_name_like=DOE", 1),
]


@pytest.mark.parametrize("filters,expected", filters)
def test_scatter_circuits(client, filters, expected, readonly_jwt):
    full_url = "/circuits?%s" % filters
    response = client.get(full_url, headers={"Authorization": "Bearer %s" % readonly_jwt})
    assert response.status_code == 200

    circuits = response.json()
    logger.debug("%s => %s" % (full_url, circuits))
    assert isinstance(circuits, list) and len(circuits) == expected
