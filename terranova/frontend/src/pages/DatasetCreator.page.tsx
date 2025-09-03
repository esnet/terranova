import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { DataController } from "../DataController";
import { DataControllerType, DataControllerContextType } from "../types/mapeditor";
import { DatasetCreatorForm } from "../components/DatasetCreatorForm";
import { API_URL } from "../../static/settings";
import { DEFAULT_DATASET } from "../data/constants";

export const DatasetListDataController = createContext<DataControllerContextType | null>(null);

export function DatasetCreatorPageComponent() {
    const navigate = useNavigate();
    // create some state here for the form
    const [formOptions, setFormOptions] = useState({
        name: "",
        fork: false,
        forkDataset: "",
        forkDatasetVersion: "",
    });
    // set up some state variables for the controller to work with
    const [datasetList, setDatasetList] = useState([]);

    // put togther the finalized API call query string (show example)
    const fieldsetString =
        "?fields=datasetId&fields=name&fields=version&fields=query" +
        "&fields=lastUpdatedBy&fields=lastUpdatedOn&version=all";

    // set up the DataController
    const [controller, _setController] = useState<DataControllerType>(
        new DataController(API_URL + "/datasets/" + fieldsetString, datasetList, setDatasetList)
    ) as any;

    // trigger a fetch of the dataset list on initial load (empty list signifies this)
    useEffect(() => {
        // trigger dataset list fetch
        controller.fetch();
    }, []); // on initial render

    // get some information from the DataController (set of options for 'select' elements, e.g.)
    async function createDataset(event: any) {
        event.preventDefault();
        let newDataset = JSON.parse(JSON.stringify(DEFAULT_DATASET));
        newDataset.name = formOptions.name;
        if (formOptions.fork) {
            datasetList.forEach((datasetToFork: any) => {
                if (
                    formOptions.forkDataset &&
                    datasetToFork.datasetId == formOptions.forkDataset &&
                    formOptions.forkDatasetVersion &&
                    datasetToFork.version == formOptions.forkDatasetVersion
                ) {
                    newDataset.query = JSON.parse(JSON.stringify(datasetToFork.query));
                }
            });
        }
        // persistence controller
        let DatasetPersistenceController = new DataController(
            API_URL + "/dataset/",
            newDataset,
            null
        );
        await DatasetPersistenceController.create();
        navigate(`/dataset/${DatasetPersistenceController.instance.datasetId}`);
    }

    return (
        <DatasetListDataController.Provider value={{ controller, instance: datasetList }}>
            <main className="main-content md:flex">
                <div className="w-full md:w-6/12 mx-auto pt-6 pb-12">
                    <DatasetCreatorForm
                        instance={formOptions}
                        instanceSetter={setFormOptions}
                        datasetList={datasetList}
                        createDataset={createDataset}
                    ></DatasetCreatorForm>
                </div>

                <div className="md:w-5/12 mx-auto mb-6">
                    <fieldset className="content-sidebar">
                        <h4>Create New Dataset</h4>
                        <p>
                            A Dataset is a set of data to be plotted on your map. To render a
                            dataset, we create a query that yields a set of nodes. Datasets are
                            later used to bundled together into a finished map, which also includes
                            styling information.
                        </p>

                        <p className="my-2 mt-6 block">
                            <strong>Fork Existing Dataset</strong>
                        </p>

                        <p>
                            One way to create a new dataset is to make a fork of an existing one
                            &mdash; which will copy the query and make a new dataset.
                        </p>
                    </fieldset>
                </div>
            </main>
        </DatasetListDataController.Provider>
    );
}
