import React, { useContext, useMemo, useState } from "react";
import { DEFAULT_LAYER_CONFIGURATION, DEFAULT_MAP } from "../data/constants";
import { DataController } from "../DataController";
import { API_URL } from "../../static/settings";
import { useNavigate } from "react-router-dom";
import { GlobalLastEditedRefresh } from "../context/GlobalLastEditedContextProvider";
import { UserDataController } from "../context/UserDataContextProvider";
import { DataControllerContextType } from "../types/mapeditor";
import {
    PktsAccordion,
    PktsInputRow,
    PktsInputText,
    PktsInputSwitch,
    PktsButton,
    PktsDivider,
    PktsInputTypeahead,
    PktsInputOption,
} from "@esnet/packets-ui-react";

type Form = {
    name?: string;
    fork?: boolean;
    forkMap?: string;
    forkMapVersion?: string;
};

export function MapCreatorForm(props: any) {
    // prefer a controlled state form over uncontrolled, because one of the inputs
    // (fork from version) is dependent on a previous value (fork from map)
    const [formValues, setFormValues] = useState<Form>({});
    const [submitting, setSubmitting] = useState(false);

    const setFormValue = (property: string) => (value: any) => {
        setFormValues((prev) => {
            const next = {
                ...prev,
                [property]: Array.isArray(value) ? value[0] : value,
            };
            if (!next.fork) delete next.forkMap;
            if (!next.forkMap) delete next.forkMapVersion;
            return next;
        });
    };

    const navigate = useNavigate();
    const refreshGlobalLastEdited = useContext(GlobalLastEditedRefresh);
    const { controller: userDataController } = useContext(UserDataController) as DataControllerContextType;

    const onSubmit = async (e: any) => {
        e.preventDefault();
        if (submitting) return;
        if (!formValues.name) return;
        if (formValues.fork && (!formValues.forkMap || !formValues.forkMapVersion)) return;
        setSubmitting(true);
        // TODO: add form basic form validation, a lengthy process

        const newMap = structuredClone(DEFAULT_MAP);
        newMap.name = formValues.name;
        const layerConfig = structuredClone(DEFAULT_LAYER_CONFIGURATION);
        layerConfig.name = "Layer 1";
        newMap.configuration.layers.push(layerConfig as never);

        if (formValues.fork) {
            const [forkFromMap] = props.mapList.filter(
                ({ mapId, version }: any) =>
                    mapId === formValues.forkMap && version === formValues.forkMapVersion,
            );
            newMap.overrides = forkFromMap.overrides;
            newMap.configuration = forkFromMap.configuration;
        }

        const MapPersistenceController = new DataController(API_URL + "/map/", newMap, null);
        await MapPersistenceController.create();
        const newMapId = MapPersistenceController.instance.mapId;

        // Track the new map in lastEdited (use raw ID list from userdata, not the full-object context)
        const currentLastEdited = userDataController.instance?.lastEdited ?? {};
        const newMaps = ((currentLastEdited?.maps ?? []) as string[]).filter((id: string) => id !== newMapId);
        newMaps.push(newMapId);
        if (newMaps.length > 3) newMaps.shift();
        userDataController.setProperty("lastEdited", { ...currentLastEdited, maps: newMaps });
        userDataController.update();

        refreshGlobalLastEdited?.();
        navigate(`/map/${newMapId}`);
    };

    return (
        <PktsAccordion className="tn-accordion" header="Create New Map">
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <PktsInputRow label="Name" required>
                    <PktsInputText
                        name="name"
                        value={formValues.name}
                        onChange={(e) => setFormValue("name")(e.target.value)}
                        required
                    />
                </PktsInputRow>
                <PktsInputRow label="Fork Existing Map">
                    <PktsInputSwitch
                        name="fork"
                        checked={formValues.fork}
                        onChange={(e) => setFormValue("fork")(e.target.checked)}
                    />
                </PktsInputRow>
                {formValues.fork && (
                    <ForkOptionsFieldset
                        formValues={formValues}
                        mapList={props.mapList}
                        setFormValue={setFormValue}
                    />
                )}
                <div className="mt-2 ml-auto w-fit">
                    <PktsButton variant="secondary" type="submit" disabled={submitting}>
                        Create Map
                    </PktsButton>
                </div>
            </form>
        </PktsAccordion>
    );
}

/**
 * separate component for the fork option inputs
 */
function ForkOptionsFieldset({
    formValues,
    setFormValue,
    mapList,
}: {
    formValues: Form;
    mapList: any[];
    setFormValue: any;
}) {
    // hash of <map ID> to { name: <map name>, versions: <sorted list of map version> }
    // used to present options to fork map from, and then options of version to fork from
    const mapHash: Record<string, { name: string; mapId: string; versions: number[] }> =
        useMemo(() => {
            if (!mapList?.length) return {};
            const table = mapList.reduce((agg: any, map: any) => {
                // a fascinating use of JS syntax I discovered
                agg[map.mapId] ??= { name: map.name, mapId: map.mapId, versions: [] };
                agg[map.mapId].versions.push(map.version);
                return agg;
            }, {});
            Object.values(table).forEach(({ versions }: any) =>
                versions.sort((a: any, b: any) => b - a),
            );
            return table;
        }, [mapList]);

    if (!formValues.fork) return null;

    return mapList.length === 0 ? (
        <small>No maps exist to fork from.</small>
    ) : (
        <>
            <PktsDivider />
            <fieldset className="flex flex-col gap-2">
                <legend className="block mb-2">Fork Existing Map Options</legend>
                <PktsInputRow label="Map Name" required>
                    <PktsInputTypeahead
                        multi={false}
                        value={formValues.forkMap ? [formValues.forkMap] : []}
                        onChange={(e) => setFormValue("forkMap")(e.target.value)}
                        name="forkMap"
                    >
                        {Object.values(mapHash).map(({ mapId, name }: any) => (
                            <PktsInputOption key={mapId} value={mapId}>
                                {name}
                            </PktsInputOption>
                        ))}
                    </PktsInputTypeahead>
                </PktsInputRow>
                <PktsInputRow label="Version" disabled={!formValues.forkMap} required>
                    <PktsInputTypeahead
                        multi={false}
                        disabled={!formValues.forkMap}
                        value={formValues.forkMapVersion ? [formValues.forkMapVersion] : []}
                        onChange={(e) => setFormValue("forkMapVersion")(e.target.value)}
                        name="forkMapVersion"
                    >
                        {formValues.forkMap &&
                            mapHash[formValues.forkMap].versions.map((versionNumber: any) => (
                                <PktsInputOption
                                    key={`${formValues.forkMap}-${versionNumber}`}
                                    value={versionNumber}
                                >
                                    {`v${versionNumber}`}
                                </PktsInputOption>
                            ))}
                    </PktsInputTypeahead>
                </PktsInputRow>
            </fieldset>
        </>
    );
}
