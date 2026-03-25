INITIAL_TEMPLATES = {
    "Geo: Simple - Circle": """<svg viewBox="-5.5 -5.5 11 11" height="10" width="10" x="-5" y="-5"><circle r="5" /></svg>""",  # noqa: E501
    "Geo: Simple - Square": """<rect height="10" width="10" x="-5" y="-5" />""",  # noqa: E501
    "Geo: Simple - Star": """<svg viewBox="-8 -8 16 16" height="20" width="20" x="-10" y="-10"><polygon points="0,-7.64 1.77,-2.19 7.5,-2.19 2.87,1.18 4.64,6.63 0,3.27 -4.64,6.63 -2.87,1.18 -7.5,-2.19 -1.77,-2.19 "/></svg>""",  # noqa: E501
    "Geo: Labelled - Circle": """<svg viewBox="-5.5 -5.5 11 11" height="10" width="10" x="-5" y="-5"><circle r="5" /></svg><text x='8' y="3" fill="#111111" stroke="none" style='font-size:12px; filter: drop-shadow(0px 0px 1px rgba(255,255,255,1.0));'>{{endpoint_name}}</text>""",  # noqa: E501
    "Geo: Labelled - Square": """<rect x='-4' y='-4' width='8' height='8' /><text x='8' y="3" fill="#111111" stroke="none" style='font-size:12px; filter: drop-shadow(0px 0px 1px rgba(255,255,255,1.0));'>{{endpoint_name}}</text>""",  # noqa: E501
    "Geo: Labelled - Star": """<svg viewBox="-8 -8 16 16" height="20" width="20" x="-10" y="-10"><polygon points="0,-7.64 1.77,-2.19 7.5,-2.19 2.87,1.18 4.64,6.63 0,3.27 -4.64,6.63 -2.87,1.18 -7.5,-2.19 -1.77,-2.19 "/></svg><text x='10' y="3" fill="#111111" stroke="none" style='font-size:12px; filter: drop-shadow(0px 0px 1px rgba(255,255,255,1.0));'>{{ endpoint_name }}</text>""",  # noqa: E501
}
