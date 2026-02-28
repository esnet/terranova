import { useContext, useState, useEffect } from "react";
import { Icon } from "../Icon.component";
import {
    MapController,
    DatasetListController,
    TemplateListController,
} from "../../pages/MapEditor.page";
import { DataControllerContextType } from "../../types/mapeditor";
import { InputRange } from "../InputRange";
import { signals } from "esnet-networkmap-panel";
import { ContentAccordion } from "../ContentAccordion.component";
import { API_URL } from "../../../static/settings";
import {
    DATASET_RENDER_MODES,
    DATASET_STATIC_OR_LIVE_OPTIONS,
    NumericMapType,
} from "../../data/constants";
import { resolvePath } from "../../data/utils";
import {
    ESAccordion,
    ESButton,
    ESDivider,
    ESInputOption,
    ESInputRow,
    ESInputSelect,
    ESInputText,
} from "@esnet/packets-ui";
import { Eye, EyeClosed, EyeOff } from "lucide-react";
import { Accordion } from "../Accordion";
import InputColor from "../InputColor";

export function MapLayerOptionsPanel(props: any) {
    const { controller: mapController, instance: theMap } = useContext(
        MapController,
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
    let [layerName, _setLayerName] = useState(thisLayer.name);

    const setLayerName = (newName: string) => {
        mapController.setProperty(`configuration.layers[${props.layerId}].name`, newName);
        _setLayerName(newName);
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
                layerUrl,
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
                <ESInputOption key={`${item.value}`} value={`${item.value}`}>
                    {item.label}
                </ESInputOption>,
            );
        });
        output.push();
        for (let i = maxVersionForSelectedDataset; i >= 1; i--) {
            output.push(
                // @ts-ignore - genuine hurdles to satisfy TS
                <ESInputOption key={`static-${i}`} value={`static-${i}`}>
                    Static &#128247; Version {i as unknown as string}
                </ESInputOption>,
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
        availableValues: Array<{ value: string | null; label: string }> | null = null,
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

    // the rendered layer name is a bit convoluted
    // by default, it's undefined, but if so, we want to show it as the dataset name
    const displayedLayerName =
        mapController.instance.configuration.layers[props.layerId].name ??
        DSL?.controller?.instance?.filter((ds: any) => {
            return ds.datasetId == selectedDataset;
        })[0]?.name;

    return (
        <Accordion
            header={
                displayedLayerName
                    ? `Layer ${props.layerId + 1}: ${displayedLayerName}`
                    : `Layer ${props.layerId + 1}`
            }
            showEye
            defaultVisibility={thisLayer.visible}
            onVisibilityChange={props.toggleLayer}
        >
            <div className="flex flex-col gap-4 lg:flex-row w-full">
                <fieldset className="w-full flex flex-col gap-2">
                    <legend>
                        <b>Dataset Options</b>
                    </legend>
                    <ESInputRow label="Import Dataset">
                        <ESInputSelect
                            name="dataset"
                            value={selectedDataset}
                            onChange={(e: any) => {
                                setSelectedDataset(e.target.value);
                                setParentSelectedDataset(e.target.value);
                            }}
                        >
                            {DSL?.controller?.instance?.map((dataset: any) => (
                                <ESInputOption
                                    value={dataset.datasetId}
                                    key={`dataset-selector-option-${dataset.datasetId}`}
                                >
                                    {dataset.name}
                                </ESInputOption>
                            ))}
                        </ESInputSelect>
                    </ESInputRow>
                    <ESInputRow label="Dataset View">
                        <ESInputSelect
                            name="version"
                            value={renderMode}
                            onChange={(e: any) => {
                                setRenderMode(e.target.value);
                            }}
                        >
                            {DATASET_RENDER_MODES.map((renderMode) => {
                                return (
                                    <ESInputOption key={renderMode.value} value={renderMode.value}>
                                        {renderMode.label}
                                    </ESInputOption>
                                );
                            })}
                        </ESInputSelect>
                    </ESInputRow>
                    <ESInputRow
                        label="Dataset Version"
                        tooltip='Using the "Dynamic" version will always keep your map up to date with the database, whereas "Static" versions represent a specific point in time. For some maps, stability is more important.'
                    >
                        <ESInputSelect
                            name="version"
                            value={`${liveOrStatic}-${version}`}
                            onChange={(e) => {
                                let [s, v] = e.target.value.split("-");
                                setLiveOrStatic(s);
                                setVersion(v);
                            }}
                        >
                            {renderVersionSelections()}
                        </ESInputSelect>
                    </ESInputRow>
                    <ESInputRow label="Layer Name">
                        <ESInputText
                            placeholder="Layer Name"
                            value={layerName}
                            onChange={(e) => setLayerName(e.target.value)}
                        />
                    </ESInputRow>
                </fieldset>
                <ESDivider className="block lg:hidden" />
                <fieldset className="w-full flex flex-col gap-2">
                    <legend>
                        <b>Node Style</b>
                    </legend>
                    <ESInputRow label="Shape">
                        <ESInputSelect
                            name="shape"
                            value={template}
                            onChange={(e: any) => {
                                setTemplate(e.target.value);
                            }}
                        >
                            {TL?.controller?.instance
                                ?.sort((a: any, b: any) => (a.name > b.name ? 1 : -1))
                                .map((template: { templateId: string; name: string }) => {
                                    return (
                                        <ESInputOption
                                            key={template.templateId}
                                            value={template.templateId}
                                        >
                                            {template.name}
                                        </ESInputOption>
                                    );
                                })}
                        </ESInputSelect>
                    </ESInputRow>
                    <ESInputRow label="Color">
                        <InputColor
                            defaultValue={thisLayer?.color}
                            onChange={(e) =>
                                handleConfigChange(`layers[${props.layerId}].color`, e.target.value)
                            }
                        />
                    </ESInputRow>
                    <ESInputRow label="Highlight Color">
                        <InputColor
                            defaultValue={thisLayer?.nodeHighlight}
                            onChange={(e) =>
                                handleConfigChange(
                                    `layers[${props.layerId}].nodeHighlight`,
                                    e.target.value,
                                )
                            }
                        />
                    </ESInputRow>
                    <ESInputRow label="Size">
                        <InputRange
                            name={`layer[${props.layerId}].nodewidth`}
                            min="1"
                            max="15"
                            step="0.25"
                            onChange={(e: { target: { valueAsNumber: string | number } }) =>
                                handleConfigChange(
                                    `layers[${props.layerId}].nodeWidth`,
                                    e.target.valueAsNumber,
                                    null,
                                )
                            }
                            defaultValue={thisLayer?.nodeWidth}
                        />
                    </ESInputRow>
                </fieldset>
                <ESDivider className="block lg:hidden" />
                <fieldset className="w-full flex flex-col gap-2">
                    <legend>
                        <b>Edge Style</b>
                    </legend>
                    <ESInputRow label="Width">
                        <InputRange
                            name={`layer[${props.layerId}].edgeWidth`}
                            min="0.5"
                            max="15"
                            step="0.25"
                            onChange={(e: { target: { valueAsNumber: string | number } }) =>
                                handleConfigChange(
                                    `layers[${props.layerId}].edgeWidth`,
                                    e.target.valueAsNumber,
                                    null,
                                )
                            }
                            defaultValue={thisLayer?.edgeWidth}
                        />
                    </ESInputRow>

                    <ESInputRow label="Offset">
                        <InputRange
                            name={`layer[${props.layerId}].edgeWidth`}
                            min="0.5"
                            max="15"
                            step="0.25"
                            onChange={(e: { target: { valueAsNumber: string | number } }) =>
                                handleConfigChange(
                                    `layers[${props.layerId}].pathOffset`,
                                    e.target.valueAsNumber,
                                    null,
                                )
                            }
                            defaultValue={thisLayer?.pathOffset}
                        />
                    </ESInputRow>

                    <div className="ml-auto mt-auto w-40">
                        <ESButton variant="destructive" onClick={props.deleteLayer}>
                            Delete Layer
                        </ESButton>
                    </div>
                </fieldset>
            </div>
        </Accordion>
    );
}
