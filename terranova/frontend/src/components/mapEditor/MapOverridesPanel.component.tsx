import React from "react";
import { DataControllerContextType } from "../../types/mapeditor";
import { ContentAccordion } from "../ContentAccordion.component";
import { MapOverride } from "./MapOverride.component";
import { DatasetListController } from "../../pages/MapEditor.page";
import { MapType } from "../../data/constants";

export function MapOverridesPanel(props: any) {
    let [overrideFormData, setOverrideFormData] = React.useState<any[]>([]);
    let [datasetNameLookup, setDatasetNameLookup] = React.useState<MapType>({});
    let DSL = React.useContext(DatasetListController) as DataControllerContextType;

    React.useEffect(() => {
        if (DSL?.controller?.instance) {
            DSL.controller.instance.forEach((dataset: { datasetId: string; name: string }) => {
                datasetNameLookup[dataset.datasetId] = dataset.name;
                setDatasetNameLookup({ ...datasetNameLookup });
            });
        }
    }, [DSL?.controller?.instance]);

    const setOverrideName = (datasetId: string, type: string, name: string) => {
        return function (newName: string) {
            let curVal = { ...props.overrides[datasetId][type][name] };
            delete props.overrides[datasetId][type][name];
            props.overrides[datasetId][type][newName] = curVal;
            props.setOverrides({ ...props.overrides });
        };
    };
    const setOverrideType = (datasetId: string, type: string, name: string) => {
        return function (newType: string) {
            let curVal = { ...props.overrides[datasetId][type][name] };
            delete props.overrides[datasetId][type][name];
            props.overrides[datasetId][newType][name] = curVal;
            props.setOverrides({ ...props.overrides });
        };
    };
    const setOverrideOperation = (datasetId: string, type: string, name: string) => {
        return function (newOperation: string) {
            props.overrides[datasetId][type][name]["operation"] = newOperation;
            props.setOverrides({ ...props.overrides });
        };
    };
    const setOverrideState = (datasetId: string, type: string, name: string) => {
        return function (newState: string) {
            props.overrides[datasetId][type][name]["state"] = newState;
            props.setOverrides({ ...props.overrides });
        };
    };
    const deleteOverride = (datasetId: string, type: string, name: string) => {
        return function () {
            delete props.overrides[datasetId][type][name];
            props.setOverrides({ ...props.overrides });
        };
    };
    const toggleOverrideVisibility = (datasetId: string, type: string, name: string) => {
        return function () {
            let curVal = props.overrides[datasetId][type][name]["render"];
            props.overrides[datasetId][type][name]["render"] = !curVal;
            props.setOverrides({ ...props.overrides });
        };
    };
    const recalcOverrideFormData = () => {
        // normalize override data from dicts to tabular structure
        let newData: any[] = [];
        let datasets = Object.keys(props.overrides);
        datasets.forEach((datasetId: string) => {
            let types = Object.keys(props.overrides[datasetId]);
            types.forEach((type) => {
                let names = Object.keys(props.overrides[datasetId][type]);
                names.forEach((name) => {
                    newData.push({
                        name: name,
                        type: type,
                        datasetId: datasetId,
                        datasetName: datasetNameLookup[datasetId],
                        operation: props.overrides[datasetId][type][name]["operation"],
                        state: props.overrides[datasetId][type][name]["state"],
                        visible: props.overrides[datasetId][type][name]["render"],
                    });
                });
            });
        });
        setOverrideFormData(newData);
    };
    React.useEffect(recalcOverrideFormData, [props.overrides]);
    return (
        <>
            <ContentAccordion
                header="Map Overrides"
                footer={`${overrideFormData.length} Overrides Applied`}
                visibility={true}
                showEye={false}
            >
                <label className="flew-row -mt-2">Rules</label>
                <table className="w-full">
                    <tbody>
                        {overrideFormData.map((override) => {
                            return (
                                <MapOverride
                                    key={`override-${override.type}-${override.name}`}
                                    override={override}
                                    setName={setOverrideName(
                                        override.datasetId,
                                        override.type,
                                        override.name
                                    )}
                                    setType={setOverrideType(
                                        override.datasetId,
                                        override.type,
                                        override.name
                                    )}
                                    setOperation={setOverrideOperation(
                                        override.datasetId,
                                        override.type,
                                        override.name
                                    )}
                                    setState={setOverrideState(
                                        override.datasetId,
                                        override.type,
                                        override.name
                                    )}
                                    delete={deleteOverride(
                                        override.datasetId,
                                        override.type,
                                        override.name
                                    )}
                                    toggleVisibility={toggleOverrideVisibility(
                                        override.datasetId,
                                        override.type,
                                        override.name
                                    )}
                                />
                            );
                        })}
                    </tbody>
                </table>
            </ContentAccordion>
        </>
    );
}
