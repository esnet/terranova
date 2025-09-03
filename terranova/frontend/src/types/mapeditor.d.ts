export interface Instance {
    // can be one of 'static', 'viewport', 'variables'
    initialViewStrategy: string;
    viewport: {
        // if initialViewStrategy is set to 'static' or 'variables'
        zoom?: number;
        // if initialViewStrategy is set to 'viewport'
        top?: number;
        left?: number;
        right?: number;
        bottom?: number;
        // if initialViewStrategy is 'static'
        center?: {
            lat: number;
            lng: number;
        };
    };
    // if initialViewStrategy is variables
    latitudeVar?: string;
    longitudeVar?: string;

    // background color and tilesets
    // Map Background Color if no tileset
    background: string;
    tileset: {
        // Geographic tileset
        // one of null, arcgis, opentopomap, usgs, esri.shaded, geoportail, cartodb.labeled or cartodb.unlabeled
        geographic: string | null;
        // Political boundary tileset
        // one of null or toner.boundaries
        boundaries: string | null;
        // Political Label tileset
        // one of null or toner.labels
        labels: string | null;
    };

    // UI visibility options
    showViewControls: boolean;
    showSidebar: boolean;
    showLegend: boolean;
    enableEditing: boolean;
    enableNodeAnimation: boolean;
    enableEdgeAnimation: boolean;
    enableScrolling: boolean;

    // legend options
    legendColumnLength?: number;
    legendPosition?: string;
    legendDefaultBehavior?: string;

    editMode: boolean; // usually/always false?

    // edge coloration thresholds
    thresholds?: any[];
    zIndexBase: number;
    layers: [
        {
            // display options
            visible: boolean;
            name: string;
            color: string;
            edgeWidth: number;
            pathOffset: number;
            nodeWidth: number;

            // "where's my topology" settings
            jsonFromUrl: boolean;
            mapjson?: string;
            mapjsonUrl?: string;

            // "data match" settings
            endpointId: string;
            inboundValueField?: string;
            outboundValueField?: string;
            nodeValueField?: string;
            srcField?: string;
            srcFieldLabel?: string;
            dstField?: string;
            dstFieldLabel?: string;
            dataFieldLabel?: string;

            // what do these even do?
            legend?: boolean;
            nodeHighlight?: string;

            // unused everywhere except grafana
            dashboardNodeVar?: string;
            dashboardEdgeSrcVar?: string;
            dashboardEdgeDstVar?: string;
        }
    ];
}

export interface Map {
    mapId: string;
    name: string;
    version: string;
    configuration: Instance;
    lastUpdatedBy: string;
    lastUpdatedOn: Date;
}

export type DataControllerType = {
    instance: any;
    link: string | null;
    error: string;
    auth: any;
    setInstance: (instance: any) => void;

    fetch: (headers?: any) => void;
    save: (method: string, headers: any) => void;
    update: () => void;
    create: () => void;
    setProperty: (property: string | null | undefined, value: any) => void;
};

export type DataControllerContextType = {
    controller: DataControllerType;
    instance: any;
};

export type HomePageContextType = {
    maps: any;
    datasets: any;
    templates: any;
};

export interface MenuItemType {
    id?: string;
    text?: string;
    href?: string;
    current?: boolean;
    icon?: string;
    collapsible?: boolean;
    collapsed?: boolean;
    className?: string;
    target?: string;
    subItems?: MenuItem[];
}

export interface MenuItemPropsType {
    item: MenuItem;
}
