// @ts-nocheck
import { useRef, useEffect } from "react";
import "esnet-networkmap-panel";
import { DEFAULT_DATASET_LOGICAL_MAP, DEFAULT_LAYER_CONFIGURATION, DIFF_LAYER_CONFIGS } from "../../data/constants";

interface LogicalDatasetMapProps {
    datasetVisible: boolean;
    topology: any;
    mapRef: any;
}

export function LogicalDatasetMap(props: LogicalDatasetMapProps) {
    let configuration = JSON.parse(JSON.stringify(DEFAULT_DATASET_LOGICAL_MAP.configuration));
    DIFF_LAYER_CONFIGS.forEach(({ color }) => {
        const layer = JSON.parse(JSON.stringify(DEFAULT_LAYER_CONFIGURATION));
        layer.color = color;
        layer.visible = props.datasetVisible;
        configuration.layers.push(layer);
    });

    useEffect(() => {
        if (props.mapRef.current) {
            const isFirstLoad = !props.mapRef.current._topology;
            props.mapRef.current.setTopology([props.topology]);
            props.mapRef.current.setOptions(configuration);
            if (isFirstLoad) props.mapRef.current.homeMap();
        }
    }, [props.mapRef, props.mapRef.current, props.topology]);
    return <esnet-map-canvas height="398" ref={props.mapRef} />;
}
