///////////////////
// TS BS
///////////////////
export type MapType = {
    [id: string]: string;
};
export type MapMapType = {
    [id: string]: MapType;
};
export type ChoiceType = {
    label: string;
    value: string;
};
export type ChoiceMapType = {
    [id: string]: ChoiceType[];
};
export type NumericMapType = {
    [id: string]: number;
};

//////////////////////
// Interface Options
//////////////////////

export const QUERY_ENDPOINTS = {
    esdb: {
        display_name: "Circuits",
        nickname: "circuit",
        nickname_plural: "circuits",
        distinct_values_endpoint: "/types",
        query_endpoint: "/circuits",
    },
    services: {
        display_name: "Services",
        nickname: "service",
        nickname_plural: "services",
        distinct_values_endpoint: "/services/distinct",
        query_endpoint: "/services",
    },
} as MapMapType;

export const DEFAULT_ENDPOINT = "esdb";

export const INPUT_MODIFIER_OPTIONS = [
    { label: "Is Exactly", value: "" },
    { label: "Is 'Like'", value: "like" },
    { label: "Is Not 'Like'", value: "not_like" },
    { label: "Does Not Equal", value: "not_equal" },
];

export const NODE_GROUP_FIELDS = {
    esdb: [
        { label: "No Grouping (default)", value: "" },
        { label: "Device Name", value: "device_name" },
    ],
    services: [
        { label: "No Grouping (default)", value: "" },
        { label: "Posture (local/remote)", value: "posture" },
        { label: "Router Name", value: "router_name" },
        { label: "Router Port", value: "router_port" },
        { label: "Site Short Name", value: "site_short_name" },
        { label: "Site ASN", value: "site_asn" },
        { label: "VLAN", value: "vlan" },
        { label: "CIDR", value: "cidr" },
    ],
} as ChoiceMapType;

export const PREVIEW_MODE_OPTIONS = [
    {
        label: "Edge Graph",
        value: "logical",
    },
    {
        label: "Geographic",
        value: "geographic",
    },
    {
        label: "Table View",
        value: "table-view",
    },
];

export const DATASET_RENDER_MODES = [
    {
        label: "Geographic",
        value: "geographic",
    },
    {
        label: "Edge Graph",
        value: "logical",
    },
];

export const DATASET_STATIC_OR_LIVE_OPTIONS = [
    {
        label: `Dynamic ${String.fromCodePoint(9889)}`,
        value: "live-latest",
    },
    {
        label: `Static ${String.fromCodePoint(128247)} Latest`,
        value: "static-latest",
    },
];

export const OVERRIDE_OPERATIONS = [
    { value: "add", label: "Add" },
    { value: "override", label: "Override" },
    { value: "delete", label: "Delete" },
];

export const OVERRIDE_TYPES = [
    { value: "nodes", label: "Node" },
    { value: "edges", label: "Edge" },
];

////////////////////////////
// Default Data Structures
////////////////////////////

export const DEFAULT_MAP = {
    name: "",
    overrides: {},
    configuration: {
        initialViewStrategy: "static",
        latitudeVar: null,
        longitudeVar: null,
        viewport: { center: { lat: 39.0, lng: -98.0 }, zoom: 3 },
        tileset: { geographic: "arcgis", boundaries: null, labels: null },
        background: "#DDDDDD",
        editMode: false,
        showSidebar: false,
        showViewControls: true,
        showLegend: false,
        legendColumnLength: 3,
        legendPosition: "bottomLeft",
        legendDefaultBehavior: "minimized",
        enableScrolling: true,
        enableEditing: false,
        enableNodeAnimation: true,
        enableEdgeAnimation: true,
        thresholds: [],
        zIndexBase: 10,
        layers: [], // see DEFAULT_LAYER_CONFIGURATION
    },
};

export const DEFAULT_LOGICAL_MAP = {
    name: "",
    overrides: {},
    configuration: {
        initialViewStrategy: "static",
        latitudeVar: null,
        longitudeVar: null,
        viewport: { center: { lat: 0.0, lng: 0.0 }, zoom: 4.0 },
        tileset: { geographic: null, boundaries: null, labels: null },
        background: "#EEEEEE",
        editMode: false,
        showSidebar: false,
        showViewControls: true,
        showLegend: false,
        legendColumnLength: 3,
        legendPosition: "bottomLeft",
        legendDefaultBehavior: "minimized",
        enableScrolling: true,
        enableEditing: false,
        enableNodeAnimation: false,
        enableEdgeAnimation: false,
        thresholds: [],
        zIndexBase: 10,
        layers: [], // see DEFAULT_LAYER_CONFIGURATION
    },
};

export const DEFAULT_LAYER_CONFIGURATION = {
    name: "",
    visible: true,
    jsonFromUrl: false,
    color: "#AAAAFF",
    nodeWidth: 5,
    edgeWidth: 1.5,
    pathOffset: 1,
    endpointId: "names",
    nodeHighlight: "#AAFFAA",
    srcFieldLabel: "Source:",
    dstFieldLabel: "Destination:",
    dataFieldLabel: "Volume:",
    srcField: "src",
    dstField: "dst",
    inboundValueField: "atoz",
    outboundValueField: "ztoa",
    nodeValueField: "node",
    legend: true,
};

export const DEFAULT_LAYER_TOPOLOGY = {
    nodes: [],
    edges: [],
};

export const DEFAULT_FILTERS = [];

export const DEFAULT_CIRCUIT_TABLE_DATA = [];

export const DEFAULT_QUERY = {
    endpoint: DEFAULT_ENDPOINT,
    filters: DEFAULT_FILTERS,
};

export const DEFAULT_DATASET = {
    name: "",
    query: DEFAULT_QUERY,
};

export const DEFAULT_TEMPLATE = {
    // TODO
};

export var DEFAULT_USER_DATA = {
    favorites: {
        maps: [],
        datasets: [],
        templates: [],
    },
    lastEdited: {
        maps: [],
        datasets: [],
        templates: [],
    },
};

export const DEFAULT_INPUT_DEBOUNCE = 1.0; // 1s.

interface OutputInstructionsType {
    [id: string]: string;
}

export const OUTPUT_INSTRUCTIONS = {
    grafana: `
        Copy the value at right.
        In Grafana, create a new NetworkMap Panel.
        Set the "Configure from URL" checkbox.
        In the URL blank that appears, enter the value you copied.
    `,
    "html-svg": `
        Copy the value at right.
        In your HTML document, paste the <img> tag you copied.
    `,
    svg: `
        The image at right displays the complete SVG code.
        Using the "Download" button, you can download the SVG document.
        Using the "Copy to Clipboard" button, you can copy the SVG code to your clipboard.
    `,
    // TODO: Add support for the below
    /*"html-script": `
        Copy the value at right.
        In your HTML document, paste the <script> tag you copied.
    `,
    "html-component": `
        At left, you will see two tags. A <script> tag and a <esnet-networkmap-panel> tag.
        In your HTML document, paste the <script> tag you copied.
        Later, you can paste the <esnet-networkmap-panel> tag to render the finished map.
    `,
    iframe: `
        Copy the value at right.
        In your HTML document, paste the <iframe> tag you copied.
        Optionally, you can also click the "Preview" button to view the contents of the IFrame directly in your browser.
    `,
    react: `
        In your React application, run "npm install esnet-networkmap-panel"
        Copy the code at right. It should give you enough of a scaffold to understand the next steps.
        Visit the Documentation link in the main left sidebar for more detailed instructions on using your map in React.
    `,
    "web-component": `
        In your application, run "npm install esnet-networkmap-panel"
        Copy the code at right. It should give you enough of a scaffold to understand the next steps.
        Visit the Documentation link in the main left sidebar for more detailed instructions on using your map in your application.
    `,*/
} as OutputInstructionsType;

export const OUTPUT_OPTIONS = [
    {
        value: "grafana",
        label: "Grafana",
    },
    {
        value: "html-svg",
        label: "SVG HTML Image Tag",
    },
    {
        value: "svg",
        label: "Raw SVG Output",
    },
    // TODO: Add support for the below
    /*{
        value: "html-script",
        label: "HTML Script Tag",
    },
    {
        value: "html-component",
        label: "HTML Web Component",
    },
    {
        value: "iframe",
        label: "IFrame",
    },
    {
        value: "react",
        label: "React Component",
    },
    {
        value: "web-component",
        label: "Web Component",
    },*/
];
