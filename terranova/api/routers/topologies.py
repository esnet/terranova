# TODO: Implement
# @app.get("/topology")
# @version(1)
# def topology_list() -> List[str]:
#     maps = elastic_backend.get_maps()
#     return maps

# @app.post("/topology")
# @version(1)
# def topology_create(topology: Topology) -> Topology:
#     if topology.id == None:
#         topology.id = uuid.uuid4()
#     backend.create(doc=topology)
#     return topology


# @app.get("/topology/name/{name}")
# @version(1)
# def topologies_by_name(name: str) -> List[Topology]:
#     return backend.get_map(name)


# @app.get("/topology/generate/{name}")
# @version(1)
# def topologies_by_name(name: str) -> List[Topology]:
#     return backend.get_map(name)