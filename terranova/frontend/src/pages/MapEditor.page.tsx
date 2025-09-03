// @ts-nocheck
// Top Level Component for the Map Editor
// Under this, we'll call
// 1. MapEditorTopBar
// 2. MapEditorSideBar
// 3. MapLayerOptionsPanel etc
import { createContext, useState, useEffect, useContext, useRef } from "react";
import { useParams } from "react-router-dom";

import { DataController, setAuthHeaders } from "../DataController";
import { Map, DataControllerType, DataControllerContextType } from "../types/mapeditor";
import { UserDataController } from "../context/UserDataContextProvider";
import { LastEdited } from "../context/LastEditedContextProvider";
import { Favorites } from "../context/FavoritesContextProvider";
import { MapEditorSidebar } from "../components/mapEditor/MapEditorSidebar.component";
import { MapLayerOptionsPanel } from "../components/mapEditor/MapLayerOptionsPanel.component";
import { MapOverridesPanel } from "../components/mapEditor/MapOverridesPanel.component";
import { Icon } from "../components/Icon.component";
import { DEFAULT_LAYER_CONFIGURATION, DEFAULT_INPUT_DEBOUNCE } from "../data/constants";
import { API_URL, LAYER_LIMIT, TOOLTIP_TTL } from "../../static/settings";
import "esnet-networkmap-panel";
import { signals } from "esnet-networkmap-panel";
import { debounce } from "lodash";

export const MapController = createContext<DataControllerContextType | null>(null);
export const DatasetListController = createContext<DataControllerContextType | null>(null);
export const TemplateListController = createContext<DataControllerContextType | null>(null);

export function MapEditorPageComponent() {
    const mapNameRefInput = useRef<HTMLInputElement>(null);

    const { mapId } = useParams();
    const q = new URLSearchParams(window.location.search);
    const queryParams = q.toString() ? `?${q.toString()}` : "";

    let lastEdited = useContext(LastEdited);
    let favorites = useContext(Favorites);
    let { controller: userDataController, instance: userdata } = useContext(
        UserDataController
    ) as DataControllerContextType;

    // map data controller
    const mapUrl = `${API_URL}/map/id/${mapId}/${queryParams}`;
    const [map, setMap] = useState<Map | null>(null) as any;
    const [mapController] = useState<DataControllerType>(
        new DataController(mapUrl, map, setMap)
    ) as any;

    // persistence for map
    const saveMapConfig = () => {
        if (mapController.update) {
            mapController.update().then(() => {
                setShowTooltip(true);
                console.log(mapController.instance);
                setTimeout(() => {
                    setShowTooltip(false);
                }, TOOLTIP_TTL * 1000);
            });
        }
        // Remove instances of mapId from the array
        let newMaps = lastEdited?.maps?.filter((e) => e !== mapId);
        newMaps?.push(mapId); // Push at the end
        if (newMaps?.length > 3) {
            newMaps?.shift(); // removes the first element
        }
        if (lastEdited) {
            lastEdited.maps = newMaps;
        }
        userDataController.setProperty(`lastEdited`, lastEdited);
        userDataController.update();
    };

    // dataset list data controller (used in map layer options panel)
    const datasetListUrl = `${API_URL}/datasets/`;
    const [datasetList, setDatasetList] = useState<any[] | null>(null) as any;
    const [datasetListController] = useState<DataControllerType>(
        new DataController(datasetListUrl, datasetList, setDatasetList)
    ) as any;

    // template list data controller (used in map layer options panel)
    const templateListUrl = `${API_URL}/templates/`;
    const [templateList, setTemplateList] = useState<any[] | null>(null) as any;
    const [templateListController] = useState<DataControllerType>(
        new DataController(templateListUrl, templateList, setTemplateList)
    ) as any;
    const [showTooltip, setShowTooltip] = useState(false);

    const [editingName, setEditingName] = useState(false);

    // data fetching for all controllers
    useEffect(() => {
        const fetchMapInstance = async () => {
            await mapController.fetch();
            await datasetListController.fetch();
            await templateListController.fetch();
        };
        fetchMapInstance();
    }, []);

    const [selectedDatasets, setSelectedDatasets] = useState([]);
    //let [overrides, setOverrides] = useState<any>({});
    let [refreshToggle, setRefreshToggle] = useState(false);

    const setOverrides = (overrides) => {
        mapController.setProperty("overrides", overrides);
    };

    useEffect(() => {
        selectedDatasets.forEach((dsId) => {
            if (!(dsId in mapController.instance.overrides)) {
                mapController.instance.overrides[dsId] = { nodes: {}, edges: {} };
                setOverrides(mapController.instance.overrides);
            }
        });
    }, [selectedDatasets]);

    const createNodeOverride = (eventInfo: { node: any; layer: number }) => {
        let editChainEntry = {
            operation: "add",
            state: eventInfo.node,
            render: true,
        };
        let datasetId = selectedDatasets[eventInfo.layer];
        mapController.instance.overrides[datasetId]["nodes"][eventInfo.node.name] = editChainEntry;
        setOverrides({ ...mapController.instance.overrides });
    };

    const updateNodeOverride = (eventInfo: { node: any; layer: number }) => {
        let editChainEntry = {
            operation: "override",
            state: eventInfo.node,
            render: true,
        };
        let datasetId = selectedDatasets[eventInfo.layer];
        mapController.instance.overrides[datasetId]["nodes"][eventInfo.node.name] = editChainEntry;
        setOverrides({ ...mapController.instance.overrides });
    };

    const deleteNodeOverride = (eventInfo: { node: any; layer: number }) => {
        let editChainEntry = {
            operation: "delete",
            render: true,
        };
        let datasetId = selectedDatasets[eventInfo.layer];
        mapController.instance.overrides[datasetId]["nodes"][eventInfo.node.name] = editChainEntry;
        setOverrides({ ...mapController.instance.overrides });
    };

    const createEdgeOverride = (eventInfo: { edge: any; layer: number }) => {
        let editChainEntry = {
            operation: "add",
            state: eventInfo.edge,
            render: true,
        };
        let datasetId = selectedDatasets[eventInfo.layer];
        mapController.instance.overrides[datasetId]["edges"][eventInfo.edge.name] = editChainEntry;
        setOverrides({ ...mapController.instance.overrides });
    };

    const updateEdgeOverride = (eventInfo: { edge: any; layer: number }) => {
        let editChainEntry = {
            operation: "override",
            state: eventInfo.edge,
            render: true,
        };
        let datasetId = selectedDatasets[eventInfo.layer];
        mapController.instance.overrides[datasetId]["edges"][eventInfo.edge.name] = editChainEntry;
        setOverrides({ ...mapController.instance.overrides });
    };

    const deleteEdgeOverride = (eventInfo: { edge: any; layer: number }) => {
        let editChainEntry = {
            operation: "delete",
            render: true,
        };
        let datasetId = selectedDatasets[eventInfo.layer];
        mapController.instance.overrides[datasetId]["edges"][eventInfo.edge.name] = editChainEntry;
        setOverrides({ ...mapController.instance.overrides });
    };

    const addLayerConfig = () => {
        let newLayer = JSON.parse(JSON.stringify(DEFAULT_LAYER_CONFIGURATION)); // deep copy
        let newIdx = map.configuration.layers.length;
        mapController.setProperty(`configuration.layers[${newIdx}]`, newLayer);
    };

    const setMapName = (newMapName: string) => {
        mapController.setProperty("name", newMapName);
        setEditingName(false);
    };

    const nameFormSubmit = (e: any) => {
        e.preventDefault();
        setMapName((mapNameRefInput.current as HTMLInputElement).value.trim());
    };

    const markFavorite = () => {
        if (favorites?.maps?.includes(mapId)) {
            const index = favorites?.maps?.indexOf(mapId);
            favorites?.maps?.splice(index, 1);
            userDataController.setProperty(`favorites`, favorites);
            userDataController.update();
        } else {
            favorites?.maps?.push(mapId);
            userDataController.setProperty(`favorites`, favorites);
            userDataController.update();
        }
    };

    const showNameForm = () => {
        setEditingName(true);
    };

    const hideNameForm = () => {
        setEditingName(false);
    };

    const toggleLayer = (idx) => {
        return (visibility) => {
            mapCanvas.current.toggleLayer(idx, visibility);
            mapController.setProperty(`configuration.layers[${idx}].visible`, visibility);
        };
    };

    const deleteLayer = (idx) => {
        return () => {
            let splicedLayers = JSON.parse(
                JSON.stringify(mapController.instance.configuration.layers)
            );
            let splicedTopology = JSON.parse(JSON.stringify(mapCanvas.current.topology));
            splicedLayers.splice(idx, 1);
            splicedTopology.splice(idx, 1);
            mapController.setProperty(`configuration.layers`, splicedLayers);
            mapCanvas.current.setTopology(splicedTopology);
        };
    };

    // map canvas setup details
    var mapCanvas = useRef<any>(null);
    useEffect(() => {
        const doInitLayersAndSubscribe = async () => {
            let opts = map.configuration;
            if (!mapCanvas?.current?.topology) {
                mapCanvas.current.setTopology([{ nodes: [], edges: [] }]);
            }
            // force enable editing on this page.
            opts.enableEditing = true;
            // also important to force editing.
            opts.topologySource = "json";
            mapCanvas.current.setOptions(opts);
            mapCanvas.current.setEditMode("node");
            let editMode = mapCanvas.current.lastValue(signals.EDITING_SET);
            mapCanvas.current.listen(signals.NODE_CREATED, createNodeOverride);
            mapCanvas.current.listen(signals.NODE_UPDATED, updateNodeOverride);
            mapCanvas.current.listen(signals.NODE_DELETED, deleteNodeOverride);
            mapCanvas.current.listen(signals.EDGE_CREATED, createEdgeOverride);
            mapCanvas.current.listen(signals.EDGE_UPDATED, updateEdgeOverride);
            mapCanvas.current.listen(signals.EDGE_DELETED, deleteEdgeOverride);
        };
        if (mapCanvas.current) {
            doInitLayersAndSubscribe();
        }
    }, [mapCanvas, mapCanvas.current]);

    const renderCount = useRef(0);
    // wrap this whole nightmare in a ref so we don't lose the
    // debounced function pointer on each render! :nausea:
    const debouncedMapFetch = useRef(
        debounce(async function fetchMap(map, localRenderCount) {
            if (renderCount.current != localRenderCount) {
                console.debug("Data state is out-of-date. Refusing to fetch out-of-date API data");
                return;
            }
            if (!mapCanvas.current) {
                console.debug("Map not loaded.");
                return;
            }
            if (mapCanvas.current.lastValue(signals.DRAG_STARTED)) {
                console.debug("Drag/edit in progress. Discarding.");
                return;
            }
            try {
                let urlToFetch = `${API_URL}/output/map/`;
                let headers: any = { "Content-Type": "application/json" };
                headers = setAuthHeaders(headers);
                let mapRevision = map;
                let response = await fetch(urlToFetch, {
                    method: "PATCH",
                    headers: headers,
                    body: JSON.stringify(mapRevision),
                });
                if (mapCanvas.current.lastValue(signals.DRAG_STARTED)) {
                    console.debug("Drag/edit in progress. Discarding.");
                    return;
                }
                if (response.ok) {
                    if (renderCount.current != localRenderCount) {
                        console.debug(
                            "Data state is out-of-date. Refusing to render out-of-date API data"
                        );
                        return;
                    }
                    let output = await response.json();
                    output = JSON.parse(JSON.stringify(output));
                    let topology = output.configuration.layers.map((layer, idx) => {
                        let parsed = JSON.parse(layer.mapjson);
                        if (!parsed) {
                            parsed = { nodes: [], edges: [] };
                        }
                        output.configuration.layers[idx].mapjson = null;
                        return parsed;
                    });
                    output.configuration.enableEditing = true;
                    output.configuration.topologySource = "json";
                    let editMode = mapCanvas.current.lastValue(signals.EDITING_SET);
                    mapCanvas.current.setOptions(output.configuration);
                    mapCanvas.current.setTopology(topology);
                    mapCanvas.current.setEditMode(editMode);
                }
            } catch (error) {
                console.log(error);
            }
        }, 100)
    );

    useEffect(() => {
        if (map?.configuration) {
            renderCount.current = renderCount.current + 1;
            // ensure that editing is always available in
            // this interface, irrespective of the option.
            debouncedMapFetch.current(map, renderCount.current);
        }
    }, [map]);

    // whoops no map
    if (!map) {
        return <main></main>;
    }

    return (
        <main className="min-h-full w-full sm:mx-auto lg:max-w-[130rem] max-w-6xl  p-2 pt-12 sm:pt-2 bg-color-layer-3 border border-color-layer-division">
            <MapController.Provider value={{ controller: mapController, instance: map }}>
                <DatasetListController.Provider
                    value={{ controller: datasetListController, instance: datasetList }}
                >
                    <TemplateListController.Provider
                        value={{ controller: templateListController, instance: templateList }}
                    >
                        {/* Header */}
                        <div className="main-content-header m-2 compound">
                            <div className="flex flex-row">
                                {favorites?.maps?.includes(mapId) ? (
                                    <div className="icon sm mr-2">
                                        <Icon
                                            name="lucide-star"
                                            fill="#00a0d6"
                                            className="stroke-esnetblue-400 -mt-[0.125rem] -ml-[0.125rem]"
                                            onClick={markFavorite}
                                        />
                                    </div>
                                ) : (
                                    <div className="icon sm mr-2">
                                        <Icon
                                            name="lucide-star"
                                            className="stroke-esnetblue-400 -mt-[0.125rem] -ml-[0.125rem]"
                                            onClick={markFavorite}
                                        />
                                    </div>
                                )}
                                <div className="icon sm mr-2">
                                    <Icon
                                        name="lucide-map"
                                        className="stroke-esnetblue-400 -mt-[0.125rem] -ml-[0.125rem]"
                                    />
                                </div>
                                {!editingName ? (
                                    map.name
                                ) : (
                                    <form onSubmit={nameFormSubmit}>
                                        <input
                                            ref={mapNameRefInput}
                                            className="text-esnetblack-900 pl-2"
                                            name="dataset-name"
                                            defaultValue={map.name}
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
                                        Saved New Version: {mapController?.instance?.version}
                                    </span>
                                ) : null}
                                <input
                                    type="button"
                                    className="btn text-base primary -my-1 -mr-2"
                                    value="Save Changes"
                                    onClick={saveMapConfig}
                                />
                            </div>
                        </div>
                        {/* Map Container + Sidebar */}
                        <div className="flex flex-row w-full mx-auto">
                            <div className="w-8/12 2xl:w-10/12 p-2">
                                <div
                                    id="mapContainer"
                                    key={refreshToggle}
                                    className="h-full w-full border"
                                >
                                    <esnet-map-canvas height="560" ref={mapCanvas} />
                                </div>
                            </div>
                            <MapEditorSidebar mapCanvasRef={mapCanvas} />
                        </div>
                        <div className="p-2 3xl:flex 3xl:flex-row">
                            <div className="3xl:w-6/12 3xl:pr-4">
                                {mapController.instance.configuration.layers.map((obj, id) => (
                                    <div className="mb-6" key={`${obj.mapjsonUrl}-${id}`}>
                                        <MapLayerOptionsPanel
                                            layerId={id}
                                            mapCanvasRef={mapCanvas}
                                            selectedDatasets={selectedDatasets}
                                            setSelectedDatasets={setSelectedDatasets}
                                            toggleLayer={toggleLayer(id)}
                                            deleteLayer={deleteLayer(id)}
                                        />
                                    </div>
                                ))}

                                {mapController.instance.configuration.layers.length <
                                LAYER_LIMIT ? (
                                    <div
                                        className="
                                mt-4
                                mb-6
                                border border-dashed
                                rounded-xl
                                p-6
                                flex
                                justify-center
                            "
                                    >
                                        <button className="primary" onClick={addLayerConfig}>
                                            + Add Topology Layer
                                        </button>
                                    </div>
                                ) : (
                                    <div></div>
                                )}
                            </div>
                            <div className="3xl:w-6/12">
                                <MapOverridesPanel
                                    key={`${Object.keys(mapController.instance.overrides)
                                        .map((k) => {
                                            return (
                                                k + "-" + mapController.instance.overrides[k].length
                                            );
                                        })
                                        .join("-")}`}
                                    overrides={mapController.instance.overrides}
                                    setOverrides={setOverrides}
                                />
                            </div>
                        </div>
                    </TemplateListController.Provider>
                </DatasetListController.Provider>
            </MapController.Provider>
        </main>
    );
}
