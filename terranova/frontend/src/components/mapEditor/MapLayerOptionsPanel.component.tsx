import { useContext, useState, useEffect } from "react";
import { Icon } from "../Icon.component";
import {
    MapController,
    DatasetListController,
    TemplateListController,
} from "../../pages/MapEditor.page";
import { DataControllerContextType } from "../../types/mapeditor";
import { CompoundSlider } from "../CompoundSlider.component";
import { signals } from "esnet-networkmap-panel";
import { ContentAccordion } from "../ContentAccordion.component";
import { API_URL } from "../../../static/settings";
import {
    DATASET_RENDER_MODES,
    DATASET_STATIC_OR_LIVE_OPTIONS,
    NumericMapType,
} from "../../data/constants";
import { resolvePath } from "../../data/utils";

export function MapLayerOptionsPanel(props: any) {
    const { controller: mapController, instance: theMap } = useContext(
        MapController
    ) as DataControllerContextType;
    let thisLayer = mapController?.instance?.configuration?.layers[props.layerId];

    // we can't use destructuring for assignment here because the names clash
    let DSL = useContext(DatasetListController) as DataControllerContextType;

    // same here
    let TL = useContext(TemplateListController) as DataControllerContextType;

    let [selectedDataset, setSelectedDataset] = useState(undefined);
    let [renderMode, setRenderMode] = useState<string | undefined>(DATASET_RENDER_MODES[0].value);
    let [liveOrStatic, setLiveOrStatic] = useState<string | undefined>("live");
    let [version, setVersion] = useState<string | null>("latest");
    let [template, setTemplate] = useState(undefined);
    let layerName = mapController.instance.configuration.layers[props.layerId].name;
    let [overrideLayerName, setLayerName] = useState(
        (layerName.indexOf(`Layer ${props.layerId + 1}`) < 0 && "") || layerName
    );

    const setOverrideLayerName = (newName: string) => {
        mapController.setProperty(`configuration.layers[${props.layerId}].name`, newName);
        setLayerName(newName);
    };

    const setParentSelectedDataset = (datasetId: string) => {
        if (props?.setSelectedDatasets) {
            let selectedDatasets = props?.selectedDatasets || [];
            selectedDatasets[props.layerId] = datasetId;
            props.setSelectedDatasets([...selectedDatasets]);
        }
    };

    const parseLayerUrl = () => {
        if (!thisLayer || !thisLayer?.mapjsonUrl) {
            return;
        }
        let layerUrl = thisLayer?.mapjsonUrl;
        let tail = layerUrl.split("/output/dataset/")[1];
        let getString = tail.split("?")[1];
        let getVars = getString?.split("&").reduce((acc: any, varPair: any) => {
            let [key, value] = varPair.split("=");
            acc[key] = value;
            return acc;
        }, {});
        let [datasetId, localRenderMode, liveOrStatic] = tail.split("/");

        let templateId = getVars?.template ? getVars.template : undefined;
        let versionNum = getVars?.version ? getVars.version : "latest";
        setSelectedDataset(datasetId);
        setRenderMode(localRenderMode);
        setTemplate(templateId);
        setLiveOrStatic(liveOrStatic);
        setVersion(versionNum);
        setParentSelectedDataset(datasetId);
    };

    const calcLayerUrl = () => {
        let layerUrl = `${API_URL}/output/dataset/${selectedDataset}/${renderMode}/${liveOrStatic}/`;
        let layerVars = [];
        if (liveOrStatic == "static" && version != "latest") {
            layerVars.push(`version=${version}`);
        }
        if (template) {
            layerVars.push(`template=${template}`);
        }
        if (layerVars.length) {
            layerUrl += "?" + layerVars.join("&");
        }
        if (liveOrStatic && selectedDataset && renderMode) {
            mapController.setProperty(
                `configuration.layers[${props.layerId}].mapjsonUrl`,
                layerUrl
            );
        }
    };

    const renderVersionSelections = () => {
        let hashTable: NumericMapType = {};
        DSL?.controller?.instance?.forEach((ds: { datasetId: string; version: any }) => {
            hashTable[ds.datasetId] = ds.version;
        });
        if (!selectedDataset) return;
        let maxVersionForSelectedDataset = hashTable[selectedDataset];
        var output = [];
        DATASET_STATIC_OR_LIVE_OPTIONS.forEach((item) => {
            output.push(
                <option key={`${item.value}`} value={`${item.value}`}>
                    {item.label}
                </option>
            );
        });
        output.push();
        for (let i = maxVersionForSelectedDataset; i >= 1; i--) {
            output.push(
                <option key={`static-${i}`} value={`static-${i}`}>
                    Static &#128247; Version {i}
                </option>
            );
        }
        return output;
    };

    useEffect(() => {
        if (DSL?.controller?.instance && !selectedDataset) {
            let datasetId = DSL?.controller?.instance?.[0]?.datasetId;
            setSelectedDataset(datasetId);
            setParentSelectedDataset(datasetId);
        }
    }, [DSL?.controller?.instance]);
    useEffect(() => {
        if (TL?.controller?.instance && !template) {
            setTemplate(TL?.controller?.instance?.[0]?.templateId);
        }
    }, [TL?.controller?.instance]);
    useEffect(() => {
        if (mapController.instance) {
            parseLayerUrl();
        }
    }, [mapController?.instance]);

    useEffect(() => {
        calcLayerUrl();
    }, [selectedDataset, renderMode, liveOrStatic, version, template]);

    const handleConfigChange = (
        property: string,
        value: string | number,
        availableValues: Array<{ value: string | null; label: string }> | null = null
    ) => {
        let newValue = value;
        let editMode = props.mapCanvasRef.current.lastValue(signals.EDITING_SET);
        mapController.setProperty(`configuration.${property}`, newValue);
        let opts = JSON.parse(JSON.stringify(mapController.instance.configuration));
        opts.enableEditing = true;
        opts.topologySource = "json";
        props.mapCanvasRef.current.setOptions(opts);
        props.mapCanvasRef.current.setEditMode(editMode);
    };

    let header = (
        <span>
            <strong>Layer {props.layerId + 1}</strong>{" "}
            {mapController.instance.configuration.layers[props.layerId].name ||
                DSL?.controller?.instance?.filter((ds: any) => {
                    return ds.datasetId == selectedDataset;
                })[0]?.name}
        </span>
    );

    let footer = (
        <>
            <span />
            <div
                className="compound hover:bg-mauve-200 cursor-pointer rounded-lg"
                onClick={props.deleteLayer}
            >
                <p className="py-1 pl-3 text-esnetblack-700">Delete Layer</p>
                <Icon className="icon btn small p-1 stroke-esnetblack-700" name="trash" />
            </div>
        </>
    );

    return (
        <>
            <ContentAccordion
                header={header}
                footer={footer}
                visibility={
                    mapController?.instance?.configuration?.layers?.[props.layerId]?.visible
                }
                showEye={true}
                setVisibilityToggle={props.toggleLayer}
            >
                <div className="lg:flex lg:flex-row w-full">
                    <div className="w-full lg:w-4/12">
                        <fieldset className="lg:h-full lg:mr-3">
                            <legend>Dataset Options</legend>
                            <label className="strong">Import Dataset</label>
                            <select
                                name="dataset"
                                className="w-full"
                                key={`dataset-selector-${DSL?.controller?.instance?.length}-${selectedDataset}`}
                                value={selectedDataset}
                                onChange={(e: any) => {
                                    setSelectedDataset(e.target.value);
                                    setParentSelectedDataset(e.target.value);
                                }}
                            >
                                {DSL?.controller?.instance?.map((dataset: any) => {
                                    return (
                                        <option value={dataset.datasetId} key={dataset.datasetId}>
                                            {dataset.name}
                                        </option>
                                    );
                                })}
                            </select>
                            <label className="strong">Dataset View</label>
                            <select
                                name="version"
                                className="w-full"
                                value={renderMode}
                                onChange={(e: any) => {
                                    setRenderMode(e.target.value);
                                }}
                            >
                                {DATASET_RENDER_MODES.map((renderMode) => {
                                    return (
                                        <option key={renderMode.value} value={renderMode.value}>
                                            {renderMode.label}
                                        </option>
                                    );
                                })}
                            </select>
                            <div className="compound justify-start">
                                <label className="strong">Dataset Version</label>
                                <div
                                    className="icon sm mt-1 -ml-1"
                                    title='Using the "Dynamic" version will always keep your map up to date with the database, whereas "Static" versions represent a specific point in time. For some maps, stability is more important.'
                                >
                                    <Icon
                                        name="help-circle"
                                        className="icon tiny stroke-esnetwhite-600"
                                    />
                                </div>
                            </div>
                            <select
                                name="version"
                                className="w-full"
                                key={`version-selector-${DSL?.controller?.instance?.length}`}
                                defaultValue={`${liveOrStatic}-${version}`}
                                onChange={(e) => {
                                    let [s, v] = e.target.value.split("-");
                                    setLiveOrStatic(s);
                                    setVersion(v);
                                }}
                            >
                                {renderVersionSelections()}
                            </select>
                            <label className="strong">Layer Name</label>
                            <input
                                type="text"
                                className="w-full"
                                defaultValue={overrideLayerName}
                                onChange={(e) => {
                                    setOverrideLayerName(e.target.value);
                                }}
                                placeholder="Override Layer Name"
                            />
                        </fieldset>
                    </div>
                    <div className="w-full lg:w-4/12">
                        <fieldset className="lg:h-full lg:mr-3">
                            <legend>Node Style</legend>
                            <label className="shape">Shape</label>
                            <select
                                name="shape"
                                className="w-full"
                                value={template}
                                onChange={(e: any) => {
                                    setTemplate(e.target.value);
                                }}
                            >
                                {TL?.controller?.instance
                                    ?.sort((a: any, b: any) => {
                                        if (a.name < b.name) {
                                            return -1;
                                        }
                                        if (a.name > b.name) {
                                            return 1;
                                        }
                                        return 0;
                                    })
                                    .map((template: { templateId: string; name: string }) => {
                                        return (
                                            <option
                                                key={template.templateId}
                                                value={template.templateId}
                                            >
                                                {template.name}
                                            </option>
                                        );
                                    })}
                            </select>
                            <div>
                                <label className="color">Color</label>
                            </div>
                            <div className="compound justify-start">
                                <input
                                    type="color"
                                    id="color"
                                    defaultValue={thisLayer?.color}
                                    onChange={(e) =>
                                        handleConfigChange(
                                            `layers[${props.layerId}].color`,
                                            e.target.value
                                        )
                                    }
                                />
                                <label htmlFor="color">Choose Color...</label>
                            </div>
                            <label htmlFor="highlight">Highlight Color</label>
                            <div className="compound justify-start">
                                <input type="color" id="highlight" defaultValue="#B6B6B6" />
                                <label htmlFor="highlight">Choose Color...</label>
                            </div>
                            <label className="size-slider">Size</label>
                            <div className="compound">
                                <CompoundSlider
                                    name={`layer[props.layerId].nodewidth`}
                                    min="1"
                                    max="15"
                                    step="0.25"
                                    onChange={(e: { target: { valueAsNumber: string | number } }) =>
                                        handleConfigChange(
                                            `layers[${props.layerId}].nodeWidth`,
                                            e.target.valueAsNumber,
                                            null
                                        )
                                    }
                                    defaultValue={thisLayer?.nodeWidth}
                                />
                            </div>
                        </fieldset>
                    </div>
                    <div className="w-full lg:w-4/12">
                        <fieldset className="lg:h-full">
                            <legend>Edge Style</legend>
                            <label className="size-slider">Width</label>
                            <div className="compound">
                                <CompoundSlider
                                    name={`layer[props.layerId].edgeWidth`}
                                    min="0.5"
                                    max="15"
                                    step="0.25"
                                    onChange={(e: { target: { valueAsNumber: string | number } }) =>
                                        handleConfigChange(
                                            `layers[${props.layerId}].edgeWidth`,
                                            e.target.valueAsNumber,
                                            null
                                        )
                                    }
                                    defaultValue={thisLayer?.edgeWidth}
                                />
                            </div>
                            <label className="size-slider">Offset</label>
                            <div className="compound">
                                <CompoundSlider
                                    name={`layer[props.layerId].pathOffset`}
                                    min="0"
                                    max="15"
                                    step="0.25"
                                    onChange={(e: { target: { valueAsNumber: string | number } }) =>
                                        handleConfigChange(
                                            `layers[${props.layerId}].pathOffset`,
                                            e.target.valueAsNumber,
                                            null
                                        )
                                    }
                                    defaultValue={thisLayer?.pathOffset}
                                />
                            </div>
                        </fieldset>
                    </div>
                </div>
            </ContentAccordion>
        </>
    );
}
