// @ts-nocheck
import { useRef, useEffect } from "react";
import "esnet-networkmap-panel";
import { DEFAULT_DATASET_MAP, DEFAULT_LAYER_CONFIGURATION, DIFF_LAYER_CONFIGS } from "../../data/constants";

interface GeographicDatasetMapProps {
    datasetVisible: boolean;
    topology: any;
    mapRef: any;
}

export function GeographicDatasetMap(props: GeographicDatasetMapProps) {
    let configuration = JSON.parse(JSON.stringify(DEFAULT_DATASET_MAP.configuration));
    DIFF_LAYER_CONFIGS.forEach(({ color }) => {
        const layer = JSON.parse(JSON.stringify(DEFAULT_LAYER_CONFIGURATION));
        layer.color = color;
        layer.visible = props.datasetVisible;
        configuration.layers.push(layer);
    });

    useEffect(() => {
        if (props.mapRef.current) {
            props.mapRef.current.setTopology([props.topology]);
            props.mapRef.current.setOptions(configuration);
            props.mapRef.current.homeMap();
        }
    }, [props.mapRef, props.mapRef.current, props.topology]);
    return <esnet-map-canvas height="398" ref={props.mapRef} />;
}
