// @ts-nocheck
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
import { DatasetEditorTopbar } from "../components/datasetEditor/DatasetEditorTopbar";
import { PktsAlert } from "@esnet/packets-ui-react";
import { DeltaOverlay, DeltaLayers } from "../components/checkpoints/DeltaOverlay";
import { DatasetDiffPicker } from "../components/checkpoints/DatasetDiffPicker";

interface IDatasetEditorPageProps {}

export const DatasetController = createContext<DataControllerContextType | null>(null);

export const DatasetEditorPageComponent = (_props: IDatasetEditorPageProps) => {
    const { datasetId } = useParams();
    const q = new URLSearchParams(window.location.search);
    const link = `${API_URL}/dataset/id/${datasetId}/`;

    // Deep-link support: ?diffFrom=<snapshotId>&diffTo=<snapshotId>
    const initialDiffFrom = q.get("diffFrom") || undefined;
    const initialDiffTo   = q.get("diffTo")   || undefined;

    let { controller: userDataController } = useContext(UserDataController) as DataControllerContextType;

    const [visualizationMode, setVisualizationMode] = useState("logical");
    const [shouldHome, setShouldHome] = useState(false);
    const [dataset, setDataset] = useState<any | undefined>(null);
    const [controller] = useState<DataController>(new DataController(link, dataset, setDataset)) as any;
    const [editingName, setEditingName] = useState(false);
    let [topologyData, setTopologyData] = useState(DEFAULT_LAYER_TOPOLOGY);
    let [tableData, setTableData] = useState<any[]>(DEFAULT_CIRCUIT_TABLE_DATA);
    let [datasetVisible, setDatasetVisible] = useState(true);
    let [showSaveAlert, setShowSaveAlert] = useState(false);
    const [loading, setLoading] = useState(false);

    // Diff picker popover
    const [pickerOpen, setPickerOpen] = useState(!!initialDiffFrom);
    let mapRef = useRef<any>();

    // Diff state
    const [activeDelta, setActiveDelta] = useState(null);
    const [activeSnapshotInfo, setActiveSnapshotInfo] = useState<{from: string; to: string} | null>(null);
    const [deltaLayers, setDeltaLayers] = useState<DeltaLayers>({ added: true, removed: true, modified: true });
    const diffDataRef = useRef(null);

    const DIFF_COLORS = { added: "#22c55e", removed: "#ef4444", modified: "#f59e0b" };

    const _applyDiffTopology = (diffData, layers) => {
        if (!mapRef.current) return;
        const topology = [
            diffData.base,
            layers.added    ? diffData.added    : { ...diffData.added,    nodes: [], edges: [] },
            layers.removed  ? diffData.removed  : { ...diffData.removed,  nodes: [], edges: [] },
            layers.modified ? diffData.modified : { ...diffData.modified, nodes: [], edges: [] },
        ];
        requestAnimationFrame(() => {
            if (!mapRef.current) return;
            mapRef.current.setTopology(topology);
        });
    };

    const exitDiffMode = (closePicker = false, refetch = true) => {
        setActiveDelta(null);
        setActiveSnapshotInfo(null);
        diffDataRef.current = null;
        if (closePicker) setPickerOpen(false);
        if (refetch) {
            if (visualizationMode === "geographic") fetchGeographicTopologyData();
            else if (visualizationMode === "logical") fetchEdgeGraphTopologyData();
            else if (visualizationMode === "table-view") fetchRawCircuitData();
        }
    };

    const toggleDeltaLayer = (layer) => {
        setDeltaLayers(prev => {
            const next = { ...prev, [layer]: !prev[layer] };
            if (diffDataRef.current) _applyDiffTopology(diffDataRef.current, next);
            return next;
        });
    };

    const handleCompare = async (fromSnapshotId: string, toSnapshotId: string, diffData: any, delta: any) => {
        // Stamp diff colors directly onto topology objects
        const stamp = (topo, color) => {
            topo.nodes.forEach(n => { n.color = color; });
            topo.edges.forEach(e => { e.azColor = color; e.zaColor = color; });
        };
        stamp(diffData.added,    DIFF_COLORS.added);
        stamp(diffData.removed,  DIFF_COLORS.removed);
        stamp(diffData.modified, DIFF_COLORS.modified);

        diffDataRef.current = diffData;
        const layers = { added: true, removed: true, modified: true };
        setDeltaLayers(layers);
        setActiveDelta(delta);
        setActiveSnapshotInfo({ from: fromSnapshotId, to: toSnapshotId });

        if (visualizationMode === "geographic" || visualizationMode === "logical") {
            _applyDiffTopology(diffData, layers);
        } else if (visualizationMode === "table-view") {
            // Load the "to" snapshot results for table display
            const headers = setAuthHeaders({ "Content-Type": "application/json" });
            const res = await fetch(`${API_URL}/snapshot/id/${toSnapshotId}/`, { headers });
            if (res.ok) {
                const snap = await res.json();
                if (Array.isArray(snap.results)) setTableData(snap.results);
            }
        }
    };

    const handleAcknowledge = (snapshotId: string) => {
        // Refresh dataset to pick up new acknowledgedCheckpointId
        controller.fetch();
        exitDiffMode(false, true);
    };

    const handleAccept = (snapshotId: string) => {
        // Refresh dataset (new currentSnapshotId was created server-side)
        controller.fetch();
        exitDiffMode(true, true);
    };

    const onModeChange = (e: ChangeEvent<HTMLSelectElement>) => {
        exitDiffMode(true, false);
        setShouldHome(true);
        setVisualizationMode(e.target.value);
    };

    useEffect(() => {
        const fetchDatasetInstance = async () => { await controller.fetch(); };
        fetchDatasetInstance();
    }, []);

    const prepRequest = (dataset: any) => {
        let headers = { "Content-Type": "application/json" };
        headers = setAuthHeaders(headers);
        let datasetRevision = { name: dataset.name, query: dataset.query };
        datasetRevision.query.filters = dataset.query.filters.filter((f: any) => !!f);
        return { headers, method: "PATCH", body: JSON.stringify(datasetRevision) };
    };

    const fetchGeographicTopologyData = async () => {
        if (!dataset || !dataset?.query?.filters?.length) return;
        let apiUrl = `${API_URL}/output/query/geographic/`;
        let requestData = prepRequest(dataset);
        fetch(apiUrl, requestData).then((response) => {
            if (response.ok) response.json().then((data) => setTopologyData(data));
        });
    };

    const fetchEdgeGraphTopologyData = async () => {
        if (!dataset || !dataset?.query?.filters?.length) return;
        let apiUrl = `${API_URL}/output/query/logical/`;
        let requestData = prepRequest(dataset);
        fetch(apiUrl, requestData).then((response) => {
            if (response.ok) response.json().then((data) => setTopologyData(data));
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
                    if (Array.isArray(responseData)) setTableData(responseData);
                    else setTableData([{ no: null, data: null }]);
                });
            }
        });
    };

    useEffect(() => {
        if (visualizationMode == "geographic") fetchGeographicTopologyData();
        if (visualizationMode == "logical") fetchEdgeGraphTopologyData();
        if (visualizationMode == "table-view") fetchRawCircuitData();
    }, [dataset, visualizationMode]);

    useEffect(() => {
        if (shouldHome) setShouldHome(false);
    }, [topologyData]);

    if (!dataset) return <main></main>;

    const getVisualization = () => {
        if (visualizationMode === "table-view") {
            return (
                <div className="overflow-auto w-full h-full">
                    <TableView
                        data={tableData}
                        loading={loading}
                        datasetVisible={datasetVisible}
                        delta={activeDelta}
                        deltaLayers={deltaLayers}
                    />
                </div>
            );
        }
        if (visualizationMode === "logical") {
            return (
                <div className="overflow-none border w-full">
                    <LogicalDatasetMap topology={topologyData} mapRef={mapRef} datasetVisible={datasetVisible} shouldHome={shouldHome} />
                </div>
            );
        }
        if (visualizationMode == "geographic") {
            return (
                <div className="overflow-none border w-full">
                    <GeographicDatasetMap topology={topologyData} mapRef={mapRef} datasetVisible={datasetVisible} shouldHome={shouldHome} />
                </div>
            );
        }
        return "Unknown visualization mode";
    };

    const setDatasetName = (newName: string) => { controller.setProperty("name", newName); setEditingName(false); };
    const toggleDatasetVisible = (visibility: boolean) => { mapRef.current.toggleLayer(0, visibility); setDatasetVisible(visibility); };

    const saveDataset = () => {
        setLoading(true);
        controller.update().then(() => {
            setShowSaveAlert(true);
            setTimeout(() => { setLoading(false); setShowSaveAlert(false); }, TOOLTIP_TTL * 1000);
        });
        const currentLastEdited = userDataController.instance?.lastEdited ?? {};
        let newDatasets = ((currentLastEdited?.datasets ?? []) as string[]).filter((e) => e !== datasetId);
        newDatasets.push(datasetId);
        if (newDatasets.length > 3) newDatasets.shift();
        userDataController.setProperty(`lastEdited`, { ...currentLastEdited, datasets: newDatasets });
        userDataController.update();
    };

    // Unreviewed indicator: latestCheckpointId exists and differs from acknowledgedCheckpointId
    const hasUnreviewed = dataset.latestCheckpointId &&
        dataset.latestCheckpointId !== dataset.acknowledgedCheckpointId;

    return (
        <DatasetController.Provider value={{ controller, instance: dataset }}>
            <main className="flex flex-col gap-4 px-4 min-h-full bg-light-background">
                {/* Topbar + diff picker popover */}
                <div className="relative">
                    <DatasetEditorTopbar
                        datasetName={dataset.name}
                        loading={loading}
                        onUpdateName={setDatasetName}
                        onDiscard={() => controller.fetch()}
                        onSave={saveDataset}
                        onToggleHistory={() => setPickerOpen((o) => !o)}
                        historyOpen={pickerOpen}
                        hasUnreviewed={hasUnreviewed}
                    />
                    {pickerOpen && datasetId && (
                        <div className="absolute right-4 top-full z-700">
                            <DatasetDiffPicker
                                datasetId={datasetId}
                                dataset={dataset}
                                visualizationMode={visualizationMode}
                                onCompare={handleCompare}
                                onAcknowledge={handleAcknowledge}
                                onAccept={handleAccept}
                                onClose={() => exitDiffMode(true)}
                                hasActiveDiff={!!activeDelta}
                                initialFromId={initialDiffFrom}
                                initialToId={initialDiffTo}
                            />
                        </div>
                    )}
                </div>

                {/* Dataset Viewer and Sidebar */}
                <div className="flex flex-row gap-4 w-full h-[432px] p-4 surface rounded-xl shadow-sm">
                    <div className="relative flex-1 min-w-0 flex">
                        {getVisualization()}
                        {activeDelta && activeSnapshotInfo && (
                            <DeltaOverlay
                                delta={activeDelta}
                                fromVersion={0}
                                toVersion={0}
                                fromSnapshotId={activeSnapshotInfo.from}
                                toSnapshotId={activeSnapshotInfo.to}
                                onDismiss={() => exitDiffMode(true)}
                                mode="dataset"
                                layers={deltaLayers}
                                onToggleLayer={toggleDeltaLayer}
                            />
                        )}
                    </div>
                    <DatasetEditorSidebar
                        visualizationMode={visualizationMode}
                        handleOnModeChange={onModeChange}
                        dataset={controller.instance}
                    />
                </div>

                <div className="gap-8 pb-4 flex flex-col">
                    <DatasetEditorQueryPanel toggleDatasetVisible={toggleDatasetVisible} datasetVisible={datasetVisible} />
                    <DatasetEditorNodeOptionsPanel />
                </div>

                {showSaveAlert && (
                    <div className="fixed right-4 bottom-4">
                        <PktsAlert variant="success" title="Dataset Saved">Snapshot saved.</PktsAlert>
                    </div>
                )}

            </main>
        </DatasetController.Provider>
    );
};
