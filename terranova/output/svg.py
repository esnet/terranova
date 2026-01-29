from pygraphviz import AGraph
from terranova.models import Map
from terranova.abstract_models import Topology
from jinja2 import Template as JinjaTemplate
from terranova.settings import SVG_OUTPUT_TEMPLATE
import orjson as json


def render_svg(topology: Topology):
    """
    Accepts a network Topology instance and returns a string containg the SVG
    markup illustrating a network graph of the nodes and edges. Utilized by
    both GET methods of /output/topology,

    @see output.topology_map_setoutput, output.topology_dataset_setoutput

    :param Topology topology:           The input topology
    :returns: The SVG markup
    """

    g = AGraph(name=f"t{topology.name}")
    g.graph_attr["size"] = "70,70"
    g.graph_attr["nodesep"] = "1"
    g.graph_attr["ranksep"] = "1"
    g.node_attr["shape"] = "box"
    for edge in topology.edges:
        g.add_edge(
            edge.meta.endpoint_identifiers["pops"][0],
            edge.meta.endpoint_identifiers["pops"][1],
            weight="2.0",
            len="1",
        )
    for node in topology.nodes:
        g.add_node(node.name)
    g.layout(prog="neato")
    markup = str(g.draw(format="svg"), encoding="utf-8")
    return markup


def compute_path(edge, quadratic=False):
    output = []
    prev = None
    if quadratic:
        down = edge["coordinates"].pop(0)
        output.append("M %s %s" % (down[1], down[0]))
        # pop off two coordinates at a time,
        # first is a control, second is an endpoint for the curve.
        while len(edge["coordinates"]) > 1:
            control = edge["coordinates"].pop(0)
            endpoint = edge["coordinates"].pop(0)
            output.append("Q %s %s %s %s" % (control[1], control[0], endpoint[1], endpoint[0]))
        # if we still have coordinates left, draw a line to the last one
        if len(edge["coordinates"]):
            end = edge["coordinates"].pop(0)
            output.append("L %s %s" % (end[1], end[0]))
    else:
        for coord in edge["coordinates"]:
            if prev is None:
                output.append(
                    "M %s %s" % (coord[1], coord[0])
                )  # Moveto (initial point. set down "pen")
            else:
                output.append(
                    "l %s %s" % (coord[1] - prev[1], coord[0] - prev[0])
                )  # lineto, (move cursor this far with "pen" down)
            prev = coord
    return " ".join(output)


def render_map_svg(map_instance: Map):
    """
    Takes a map instance

    Outputs an SVG rendering of the map
    """
    templ = JinjaTemplate(SVG_OUTPUT_TEMPLATE)

    map_instance = map_instance.model_dump()
    configuration = map_instance["configuration"]

    layers = [json.loads(layer["mapjson"]) for layer in configuration["layers"]]
    viewbox = {"min": {"y": 0, "x": 0}, "max": {"y": 0, "x": 0}, "delta": {"y": 0, "x": 0}}
    LATLNG_SCALE_FACTOR = 11
    for idx, layer in enumerate(layers):
        layer["index"] = idx
        layer_config = configuration["layers"][idx]
        for node in layer["nodes"]:
            # scale lat/lng to pixels
            node["coordinate"] = [coord * LATLNG_SCALE_FACTOR for coord in node["coordinate"]]
            # reverse the Y axis coord. SVG lays out in opposite direction from map
            node["coordinate"][0] = node["coordinate"][0] * -1
            # to find the max/min, we add half of the computed height of the node
            # (if available), and the node_width for a little extra padding
            y_min = (
                node["coordinate"][0]
                - ((node.get("meta", {}).get("computed_height", 0) or 0) * 0.5)
                + (-1 * layer_config["nodeWidth"])
            )
            y_max = (
                node["coordinate"][0]
                + ((node.get("meta", {}).get("computed_height", 0) or 0) * 0.5)
                + layer_config["nodeWidth"]
            )
            x_min = (
                node["coordinate"][1]
                - ((node.get("meta", {}).get("computed_width", 0) or 0) * 0.5)
                + (-1 * layer_config["nodeWidth"])
            )
            x_max = (
                node["coordinate"][1]
                + ((node.get("meta", {}).get("computed_width", 0) or 0) * 0.5)
                + layer_config["nodeWidth"]
            )
            # viewbox accounting
            if y_min < viewbox["min"]["y"]:
                viewbox["min"]["y"] = y_min
            if x_min < viewbox["min"]["x"]:
                viewbox["min"]["x"] = x_min
            if y_max > viewbox["max"]["y"]:
                viewbox["max"]["y"] = y_max
            if x_max > viewbox["max"]["x"]:
                viewbox["max"]["x"] = x_max

        layer["groups"] = [node for node in layer["nodes"] if node["children"]]
        layer["nodes"] = [node for node in layer["nodes"] if not node["children"]]
        for edge in layer["edges"]:
            # reverse the Y axis coord. SVG lays out in opposite direction from lat/lng map
            edge["coordinates"] = [
                [coord[0] * -1 * LATLNG_SCALE_FACTOR, coord[1] * LATLNG_SCALE_FACTOR]
                for coord in edge["coordinates"]
            ]
            edge["computed_path"] = compute_path(
                edge, quadratic=layer.get("pathLayout", {}).get("type") == "curveCardinal"
            )
        viewbox["delta"]["y"] = viewbox["max"]["y"] - viewbox["min"]["y"]
        viewbox["delta"]["x"] = viewbox["max"]["x"] - viewbox["min"]["x"]
        layer["edge_stroke_width"] = configuration["layers"][layer["index"]]["edgeWidth"]
        layer["node_stroke_width"] = 1
    return templ.render(
        layers=layers,
        viewbox=viewbox,
        configuration=configuration,
        node_scale_factor=1,
    )
