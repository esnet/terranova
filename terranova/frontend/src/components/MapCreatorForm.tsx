import {
    ESAccordion,
    ESButton,
    ESDivider,
    ESInputOption,
    ESInputRow,
    ESInputSwitch,
    ESInputText,
    ESInputTypeahead,
} from "@esnet/packets-ui";
import React, { useMemo, useState } from "react";
import { DEFAULT_LAYER_CONFIGURATION, DEFAULT_MAP } from "../data/constants";
import { DataController } from "../DataController";
import { API_URL } from "../../static/settings";
import { useNavigate } from "react-router-dom";

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
    const onSubmit = async (e: any) => {
        e.preventDefault();
        if (!formValues.name) return;
        if (formValues.fork && (!formValues.forkMap || !formValues.forkMapVersion)) return;
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
        navigate(`/map/${MapPersistenceController.instance.mapId}`);
    };

    return (
        <ESAccordion header="Create New Map">
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <ESInputRow label="Name" required>
                    <ESInputText
                        name="name"
                        value={formValues.name}
                        onChange={(e) => setFormValue("name")(e.target.value)}
                        required
                    />
                </ESInputRow>
                <ESInputRow label="Fork Existing Map">
                    <ESInputSwitch
                        name="fork"
                        checked={formValues.fork}
                        onChange={(e) => setFormValue("fork")(e.target.checked)}
                    />
                </ESInputRow>
                {formValues.fork && (
                    <ForkOptionsFieldset
                        formValues={formValues}
                        mapList={props.mapList}
                        setFormValue={setFormValue}
                    />
                )}
                <div className="mt-2 ml-auto w-fit">
                    <ESButton variant="secondary" type="submit">
                        Create Map
                    </ESButton>
                </div>
            </form>
        </ESAccordion>
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
            <ESDivider />
            <fieldset className="flex flex-col gap-2">
                <legend className="block mb-2">Fork Existing Map Options</legend>
                <ESInputRow label="Map Name" required>
                    <ESInputTypeahead
                        multi={false}
                        value={formValues.forkMap ? [formValues.forkMap] : []}
                        onChange={(e) => setFormValue("forkMap")(e.target.value)}
                        name="forkMap"
                    >
                        {Object.values(mapHash).map(({ mapId, name }: any) => (
                            <ESInputOption key={mapId} value={mapId}>
                                {name}
                            </ESInputOption>
                        ))}
                    </ESInputTypeahead>
                </ESInputRow>
                <ESInputRow label="Version" disabled={!formValues.forkMap} required>
                    <ESInputTypeahead
                        multi={false}
                        disabled={!formValues.forkMap}
                        value={formValues.forkMapVersion ? [formValues.forkMapVersion] : []}
                        onChange={(e) => setFormValue("forkMapVersion")(e.target.value)}
                        name="forkMapVersion"
                    >
                        {formValues.forkMap &&
                            mapHash[formValues.forkMap].versions.map((versionNumber: any) => (
                                <ESInputOption
                                    key={`${formValues.forkMap}-${versionNumber}`}
                                    value={versionNumber}
                                >
                                    {`v${versionNumber}`}
                                </ESInputOption>
                            ))}
                    </ESInputTypeahead>
                </ESInputRow>
            </fieldset>
        </>
    );
}
