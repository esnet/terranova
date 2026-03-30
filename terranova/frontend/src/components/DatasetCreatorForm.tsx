import { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DEFAULT_DATASET } from "../data/constants";
import { DataController } from "../DataController";
import { API_URL } from "../../static/settings";
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
    forkDataset?: string;
    forkDatasetVersion?: string;
};

/**
 * Dataset creator form used in the dataset creation page. Entirely surrounded in
 */
export function DatasetCreatorForm(props: any) {
    // prefer a controlled state form over uncontrolled, because one of the inputs
    // (fork from version) is dependent on a previous value (fork from dataset)
    const [formValues, setFormValues] = useState<Form>({});

    const setFormValue = (property: string) => (value: any) => {
        setFormValues((prev) => {
            const next = {
                ...prev,
                [property]: Array.isArray(value) ? value[0] : value,
            };
            if (!next.fork) delete next.forkDataset;
            if (!next.forkDataset) delete next.forkDatasetVersion;
            return next;
        });
    };

    const navigate = useNavigate();
    const refreshGlobalLastEdited = useContext(GlobalLastEditedRefresh);
    const { controller: userDataController } = useContext(UserDataController) as DataControllerContextType;

    // get some information from the DataController (set of options for 'select' elements, e.g.)
    const onSubmit = async (e: any) => {
        e.preventDefault();
        if (!formValues.name) return;
        if (formValues.fork && (!formValues.forkDataset || !formValues.forkDatasetVersion)) return;
        // TODO: add form basic form validation, a lengthy process

        const newDataset = structuredClone(DEFAULT_DATASET);
        newDataset.name = formValues.name;

        if (formValues.fork) {
            const [forkFromDataset] = props.datasetList.filter(
                ({ datasetId, version }: any) =>
                    datasetId === formValues.forkDataset &&
                    version === formValues.forkDatasetVersion,
            );
            newDataset.query = structuredClone(forkFromDataset.query);
        }

        const DatasetPersistenceController = new DataController(
            API_URL + "/dataset/",
            newDataset,
            null,
        );
        await DatasetPersistenceController.create();
        const newDatasetId = DatasetPersistenceController.instance.datasetId;

        // Track the new dataset in lastEdited (use raw ID list from userdata, not the full-object context)
        const currentLastEdited = userDataController.instance?.lastEdited ?? {};
        const newDatasets = ((currentLastEdited?.datasets ?? []) as string[]).filter((id: string) => id !== newDatasetId);
        newDatasets.push(newDatasetId);
        if (newDatasets.length > 3) newDatasets.shift();
        userDataController.setProperty("lastEdited", { ...currentLastEdited, datasets: newDatasets });
        userDataController.update();

        refreshGlobalLastEdited?.();
        navigate(`/dataset/${newDatasetId}`);
    };

    return (
        <PktsAccordion className="tn-accordion" header="Create New Dataset">
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <PktsInputRow label="Name" required>
                    <PktsInputText
                        name="name"
                        value={formValues.name}
                        onChange={(e) => setFormValue("name")(e.target.value)}
                        required
                    />
                </PktsInputRow>
                <PktsInputRow label="Fork Existing Dataset">
                    <PktsInputSwitch
                        name="fork"
                        checked={formValues.fork}
                        onChange={(e) => setFormValue("fork")(e.target.checked)}
                    />
                </PktsInputRow>
                {formValues.fork && (
                    <ForkOptionsFieldset
                        formValues={formValues}
                        datasetList={props.datasetList}
                        setFormValue={setFormValue}
                    />
                )}
                <div className="mt-2 ml-auto w-fit">
                    <PktsButton variant="secondary" type="submit">
                        Create Dataset
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
    datasetList,
}: {
    formValues: Form;
    datasetList: any[];
    setFormValue: any;
}) {
    // hash of <dataset ID> to { name: <dataset name>, versions: <sorted list of dataset version> }
    // used to present options to fork dataset from, and then options of version to fork from
    const datasetHash: Record<string, { name: string; datasetId: string; versions: number[] }> =
        useMemo(() => {
            if (!datasetList?.length) return {};
            const table = datasetList.reduce((agg: any, dataset: any) => {
                agg[dataset.datasetId] ??= {
                    name: dataset.name,
                    datasetId: dataset.datasetId,
                    versions: [],
                };
                agg[dataset.datasetId].versions.push(dataset.version);
                return agg;
            }, {});
            Object.values(table).forEach(({ versions }: any) =>
                versions.sort((a: any, b: any) => b - a),
            );
            return table;
        }, [datasetList]);

    if (!formValues.fork) return null;

    return datasetList.length === 0 ? (
        <small>No datasets exist to fork from.</small>
    ) : (
        <>
            <PktsDivider />
            <fieldset className="flex flex-col gap-2">
                <legend className="block mb-2">Fork Existing Dataset Options</legend>
                <PktsInputRow label="Dataset Name" required>
                    <PktsInputTypeahead
                        multi={false}
                        value={formValues.forkDataset ? [formValues.forkDataset] : []}
                        onChange={(e) => setFormValue("forkDataset")(e.target.value)}
                        name="forkDataset"
                    >
                        {Object.values(datasetHash).map(({ datasetId, name }: any) => (
                            <PktsInputOption key={datasetId} value={datasetId}>
                                {name}
                            </PktsInputOption>
                        ))}
                    </PktsInputTypeahead>
                </PktsInputRow>
                <PktsInputRow label="Version" disabled={!formValues.forkDataset} required>
                    <PktsInputTypeahead
                        multi={false}
                        disabled={!formValues.forkDataset}
                        value={formValues.forkDatasetVersion ? [formValues.forkDatasetVersion] : []}
                        onChange={(e) => setFormValue("forkDatasetVersion")(e.target.value)}
                        name="forkDatasetVersion"
                    >
                        {formValues.forkDataset &&
                            datasetHash[formValues.forkDataset].versions.map(
                                (versionNumber: any) => (
                                    <PktsInputOption
                                        key={`${formValues.forkDataset}-${versionNumber}`}
                                        value={versionNumber}
                                    >
                                        {`v${versionNumber}`}
                                    </PktsInputOption>
                                ),
                            )}
                    </PktsInputTypeahead>
                </PktsInputRow>
            </fieldset>
        </>
    );
}
