import { ChangeEvent, createContext, useContext, useEffect, useRef, useState } from "react";
import { DatasetEditorSidebar } from "../components/datasetEditor/DatasetEditorSidebar.component";
import { Icon } from "../components/Icon.component";
import { useParams } from "react-router-dom";
import { DataController, setAuthHeaders } from "../DataController";
import { UserDataController } from "../context/UserDataContextProvider";
import { LastEdited } from "../context/LastEditedContextProvider";
import { Favorites } from "../context/FavoritesContextProvider";
import { TableView } from "../components/datasetEditor/TableView.component";
import { DatasetEditorQueryPanel } from "../components/datasetEditor/DatasetEditorQueryPanel.component";
import { DatasetEditorNodeOptionsPanel } from "../components/datasetEditor/DatasetEditorNodeOptionsPanel.component";
import { LogicalDatasetMap } from "../components/datasetEditor/LogicalDatasetMap.component";
import { GeographicDatasetMap } from "../components/datasetEditor/GeographicDatasetMap.component";
import { DEFAULT_LAYER_TOPOLOGY, DEFAULT_CIRCUIT_TABLE_DATA } from "../data/constants";
import { API_URL, TOOLTIP_TTL } from "../../static/settings";
import { DataControllerContextType } from "../types/mapeditor";
import { PubSub } from "esnet-networkmap-panel";

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
    const queryParams = q.toString() ? `?${q.toString()}` : "";
    const link = `${API_URL}/dataset/id/${datasetId}/`;

    let lastEdited = useContext(LastEdited);
    let favorites = useContext(Favorites);
    let { controller: userDataController, instance: userdata } = useContext(
        UserDataController
    ) as DataControllerContextType;

    const [visualizationMode, setVisualizationMode] = useState("logical"); // one of ["logical", "table-view", "geographic"]?

    const [dataset, setDataset] = useState<any | undefined>(null);

    const [controller] = useState<DataController>(
        new DataController(link, dataset, setDataset)
    ) as any;

    const [editingName, setEditingName] = useState(false);
    let [topologyData, setTopologyData] = useState(DEFAULT_LAYER_TOPOLOGY);
    let [loading, setLoading] = useState(true);
    let [tableData, setTableData] = useState<any[]>(DEFAULT_CIRCUIT_TABLE_DATA);
    let [showLoadingInterstitial, setShowLoadingInterstitial] = useState(false);
    let [datasetVisible, setDatasetVisible] = useState(true);
    let [showTooltip, setShowTooltip] = useState(false);

    let mapRef = useRef<any>();

    useEffect(() => {
        const fetchDatasetInstance = async () => {
            await controller.fetch();
        };
        fetchDatasetInstance();
    }, []);

    const markFavorite = () => {
        if (favorites?.datasets?.includes(datasetId)) {
            const index = favorites?.datasets?.indexOf(datasetId);
            favorites?.datasets?.splice(index, 1);
            userDataController.setProperty(`favorites`, favorites);
            userDataController.update();
        } else {
            favorites?.datasets?.push(datasetId);
            userDataController.setProperty(`favorites`, favorites);
            userDataController.update();
        }
    };

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
        return null;
    }

    const getVisualization = () => {
        let output = null;
        let classes = ["h-full", "w-full", "border", "[min-height:25rem]", "[max-height:25rem]"];
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
        // need to remove some properties of the
        // object under edit to conform to the
        // schema.
        let propsToClear: any[] = [];
        propsToClear.forEach((prop) => {
            controller.setProperty(prop, null);
        });
        controller.update().then(() => {
            setShowTooltip(true);
            setTimeout(() => {
                setShowTooltip(false);
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
            <main className="main-content">
                {/*  Upper content area  */}
                <div className="main-content-header m-2 compound">
                    <div className="flex flex-row">
                        {favorites?.datasets?.includes(datasetId) ? (
                            <div className="icon sm p-1 mr-2">
                                <Icon
                                    name="lucide-star"
                                    fill="#00a0d6"
                                    className="stroke-esnetblue-400 -mt-[0.125rem] -ml-[0.125rem]"
                                    onClick={markFavorite}
                                />
                            </div>
                        ) : (
                            <div className="icon sm p-1 mr-2">
                                <Icon
                                    name="lucide-star"
                                    className="stroke-esnetblue-400 -mt-[0.125rem] -ml-[0.125rem]"
                                    onClick={markFavorite}
                                />
                            </div>
                        )}
                        <div className="icon sm p-1 mr-2">
                            <Icon
                                name="database"
                                height={20}
                                width={20}
                                className="database lucide-database stroke-esnetblue-400 -mt-[0.125rem]"
                            />
                        </div>
                        {!editingName ? (
                            <span id="dataset-display-name">{dataset.name}</span>
                        ) : (
                            <form onSubmit={nameFormSubmit}>
                                <input
                                    ref={datasetNameRefInput}
                                    className="text-esnetblack-900"
                                    name="dataset-name"
                                    defaultValue={dataset.name}
                                />
                            </form>
                        )}
                        {!editingName ? (
                            <Icon
                                name="pencil"
                                height={20}
                                width={20}
                                onClick={showNameForm}
                                className="pencil lucide-pencil stroke-esnetblue-400 icon btn sm p-1 ml-2 -ml-[0.125rem]"
                            />
                        ) : (
                            <>
                                <Icon
                                    name="check-square"
                                    className="check-square lucide-check-square stroke-esnetblue-400 icon btn sm p-1 ml-2 -ml-[0.125rem]"
                                    onClick={nameFormSubmit}
                                />
                                <Icon
                                    name="x-square"
                                    onClick={hideNameForm}
                                    className="x-square lucide-x-square stroke-esnetblue-400 icon btn sm p-1 ml-2 -ml-[0.125rem]"
                                />
                            </>
                        )}
                    </div>

                    <div className="flex flex-row">
                        <form action="">
                            <input
                                type="submit"
                                className="btn text-base -my-1 mr-2"
                                value="Discard Changes"
                            />
                        </form>
                        {showTooltip ? (
                            <span
                                className={`tooltip-box animate-fade absolute opacity-0 z-20 pt-[0.125rem] text-sm -top-3 right-16`}
                            >
                                Saved New Version: {controller.instance?.version}
                            </span>
                        ) : null}
                        <input
                            type="button"
                            className="btn text-base primary -my-1 -mr-2"
                            value="Save Changes"
                            onClick={saveDataset}
                        />
                    </div>
                </div>

                <div id="upper-main-pane" className="flex flex-row w-full mx-auto justify-between">
                    <div className="w-8/12 p-2">{getVisualization()}</div>
                    <DatasetEditorSidebar
                        visualizationMode={visualizationMode}
                        handleOnModeChange={onModeChange}
                        dataset={controller.instance}
                    />
                </div>

                <div id="lower-main-pane" className="px-2">
                    <DatasetEditorQueryPanel
                        toggleDatasetVisible={toggleDatasetVisible}
                        datasetVisible={datasetVisible}
                    />

                    <DatasetEditorNodeOptionsPanel />
                </div>
            </main>
        </DatasetController.Provider>
    );
};
