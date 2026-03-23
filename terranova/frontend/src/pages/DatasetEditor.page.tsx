import { ChangeEvent, createContext, useContext, useEffect, useRef, useState } from "react";
import { DatasetEditorSidebar } from "../components/datasetEditor/DatasetEditorSidebar.component";
import { useParams } from "react-router-dom";
import { DataController, setAuthHeaders } from "../DataController";
import { UserDataController } from "../context/UserDataContextProvider";
import { LastEdited } from "../context/LastEditedContextProvider";
import { TableView } from "../components/datasetEditor/TableView.component";
import { DatasetEditorQueryPanel } from "../components/datasetEditor/DatasetEditorQueryPanel.component";
import { DatasetEditorNodeOptionsPanel } from "../components/datasetEditor/DatasetEditorNodeOptionsPanel.component";
import { LogicalDatasetMap } from "../components/datasetEditor/LogicalDatasetMap.component";
import { GeographicDatasetMap } from "../components/datasetEditor/GeographicDatasetMap.component";
import { DEFAULT_LAYER_TOPOLOGY, DEFAULT_CIRCUIT_TABLE_DATA } from "../data/constants";
import { API_URL, TOOLTIP_TTL } from "../../static/settings";
import { DataControllerContextType } from "../types/mapeditor";
import { ESAlert } from "@esnet/packets-ui";
import { DatasetEditorTopbar } from "../components/datasetEditor/DatasetEditorTopbar";

interface IDatasetEditorPageProps {}

export const DatasetController = createContext<DataControllerContextType | null>(null);

export const DatasetEditorPageComponent = (_props: IDatasetEditorPageProps) => {
    const datasetNameRefInput = useRef<HTMLInputElement>(null);

    const onModeChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setVisualizationMode(e.target.value);
        mapRef?.current?.homeMap();
    };

    const { datasetId } = useParams();
    const q = new URLSearchParams(window.location.search);
    const link = `${API_URL}/dataset/id/${datasetId}/`;

    let lastEdited = useContext(LastEdited);
    let { controller: userDataController } = useContext(
        UserDataController,
    ) as DataControllerContextType;

    const [visualizationMode, setVisualizationMode] = useState("logical"); // one of ["logical", "table-view", "geographic"]?

    const [dataset, setDataset] = useState<any | undefined>(null);

    const [controller] = useState<DataController>(
        new DataController(link, dataset, setDataset),
    ) as any;

    const [editingName, setEditingName] = useState(false);
    let [topologyData, setTopologyData] = useState(DEFAULT_LAYER_TOPOLOGY);
    let [tableData, setTableData] = useState<any[]>(DEFAULT_CIRCUIT_TABLE_DATA);
    let [datasetVisible, setDatasetVisible] = useState(true);
    let [showSaveAlert, setShowSaveAlert] = useState(false);
    const [loading, setLoading] = useState(false);

    let mapRef = useRef<any>();

    useEffect(() => {
        const fetchDatasetInstance = async () => {
            await controller.fetch();
        };
        fetchDatasetInstance();
    }, []);

    const prepRequest = (dataset: any) => {
        let headers = {
            "Content-Type": "application/json",
        };
        headers = setAuthHeaders(headers);
        let datasetRevision = {
            name: dataset.name,
            query: dataset.query,
        };
        // remove 'null' from filters -- side effect of side effect.
        // see DatasetQueryPanel.deleteCriterion.
        datasetRevision.query.filters = dataset.query.filters.filter((f: any) => !!f);
        let requestData = {
            headers: headers,
            method: "PATCH",
            body: JSON.stringify(datasetRevision),
        };
        return requestData;
    };

    const fetchGeographicTopologyData = async () => {
        if (!dataset || !dataset?.query?.filters?.length) return;
        let apiUrl = `${API_URL}/output/query/geographic/`;
        let requestData = prepRequest(dataset);
        fetch(apiUrl, requestData).then((response) => {
            if (response.ok) {
                response.json().then((topologyData) => {
                    setTopologyData(topologyData);
                });
            }
        });
    };

    const fetchEdgeGraphTopologyData = async () => {
        if (!dataset || !dataset?.query?.filters?.length) return;
        let apiUrl = `${API_URL}/output/query/logical/`;
        let requestData = prepRequest(dataset);
        fetch(apiUrl, requestData).then((response) => {
            if (response.ok) {
                response.json().then((topologyData) => {
                    setTopologyData(topologyData);
                });
            }
        });
    };

    const fetchRawCircuitData = async () => {
        if (!dataset || !dataset?.query?.filters?.length) return;
        let apiUrl = `${API_URL}/output/query/raw/`;
        let requestData = prepRequest(dataset);
        setLoading(true);
        fetch(apiUrl, requestData).then((response) => {
            if (response.ok) {
                response.json().then((responseData: any[]) => {
                    setLoading(false);
                    if (Array.isArray(responseData)) {
                        setTableData(responseData);
                    } else {
                        setTableData([{ no: null, data: null }]);
                    }
                });
            }
        });
    };

    useEffect(() => {
        if (visualizationMode == "geographic") {
            fetchGeographicTopologyData();
        }
        if (visualizationMode == "logical") {
            fetchEdgeGraphTopologyData();
        }
        if (visualizationMode == "table-view") {
            fetchRawCircuitData();
        }
    }, [dataset, visualizationMode]);

    if (!dataset) {
        return <main></main>;
    }

    const getVisualization = () => {
        let output = null;
        let classes = ["h-fit", "w-3/4", "border"];
        if (visualizationMode === "table-view") {
            output = (
                <TableView data={tableData} loading={loading} datasetVisible={datasetVisible} />
            );
            classes.push("overflow-auto");
        }
        if (visualizationMode === "logical") {
            output = (
                <LogicalDatasetMap
                    topology={topologyData}
                    mapRef={mapRef}
                    datasetVisible={datasetVisible}
                />
            );
            classes.push("overflow-none");
        }
        if (visualizationMode == "geographic") {
            output = (
                <GeographicDatasetMap
                    topology={topologyData}
                    mapRef={mapRef}
                    datasetVisible={datasetVisible}
                />
            );
            classes.push("overflow-none");
        }
        return <div className={classes.join(" ")}>{output}</div>;
    };

    const setDatasetName = (newDatasetName: string) => {
        controller.setProperty("name", newDatasetName);
        setEditingName(false);
    };

    const nameFormSubmit = (e: any) => {
        e.preventDefault();
        setDatasetName((datasetNameRefInput.current as HTMLInputElement).value.trim());
    };

    const showNameForm = () => {
        setEditingName(true);
    };

    const hideNameForm = () => {
        setEditingName(false);
    };

    const toggleDatasetVisible = (visibility: boolean) => {
        mapRef.current.toggleLayer(0, visibility);
        setDatasetVisible(visibility);
    };

    const saveDataset = () => {
        setLoading(true);
        let propsToClear: any[] = [];
        propsToClear.forEach((prop) => {
            controller.setProperty(prop, null);
        });
        controller.update().then(() => {
            setShowSaveAlert(true);
            setTimeout(() => {
                setLoading(false);
                setShowSaveAlert(false);
            }, TOOLTIP_TTL * 1000);
        });

        // Remove instances of mapId from the array
        let newDatasets = lastEdited?.datasets?.filter((e: any) => e !== datasetId);
        newDatasets?.push(datasetId); // Push at the end
        if (newDatasets?.length > 3) {
            newDatasets?.shift(); // removes the first element
        }
        if (lastEdited) {
            lastEdited.datasets = newDatasets;
        }
        userDataController.setProperty(`lastEdited`, lastEdited);
        userDataController.update();
    };

    return (
        <DatasetController.Provider value={{ controller, instance: dataset }}>
            <main className="flex flex-col gap-4 px-4 min-h-full bg-light-background">
                {/* Topbar */}
                <DatasetEditorTopbar
                    datasetName={dataset.name}
                    loading={loading}
                    onUpdateName={setDatasetName}
                    onDiscard={() => controller.fetch()}
                    onSave={saveDataset}
                />

                {/* Dataset Viewer and Sidebar */}
                <div className="flex flex-row gap-4 w-full h-[700] p-4 surface rounded-xl shadow-sm">
                    {getVisualization()}
                    <DatasetEditorSidebar
                        visualizationMode={visualizationMode}
                        handleOnModeChange={onModeChange}
                        dataset={controller.instance}
                    />
                </div>

                <div className="gap-8 pb-4 flex flex-col">
                    <DatasetEditorQueryPanel
                        toggleDatasetVisible={toggleDatasetVisible}
                        datasetVisible={datasetVisible}
                    />
                    <DatasetEditorNodeOptionsPanel />
                </div>

                {showSaveAlert && (
                    <div className="fixed right-4 bottom-4">
                        <ESAlert variant="success" title="Dataset Saved">
                            New Version: v{controller.instance?.version}.
                        </ESAlert>
                    </div>
                )}
            </main>
        </DatasetController.Provider>
    );
};
