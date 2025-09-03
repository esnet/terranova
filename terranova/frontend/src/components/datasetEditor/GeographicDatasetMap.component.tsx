// @ts-nocheck
import { useRef, useEffect } from "react";
import "esnet-networkmap-panel";
import { DEFAULT_MAP, DEFAULT_LAYER_CONFIGURATION } from "../../data/constants";

interface GeographicDatasetMapProps {
    datasetVisible: boolean;
    topology: any;
    mapRef: any;
}

export function GeographicDatasetMap(props: GeographicDatasetMapProps) {
    let configuration = JSON.parse(JSON.stringify(DEFAULT_MAP.configuration));
    let layerConfiguration = JSON.parse(JSON.stringify(DEFAULT_LAYER_CONFIGURATION));
    layerConfiguration.visible = props.datasetVisible;
    configuration.layers.push(layerConfiguration);

    useEffect(() => {
        if (props.mapRef.current) {
            props.mapRef.current.setTopology([props.topology]);
            props.mapRef.current.setOptions(configuration);
        }
    }, [props.mapRef, props.mapRef.current, props.topology]);
    return <esnet-map-canvas height="398" ref={props.mapRef} />;
}
