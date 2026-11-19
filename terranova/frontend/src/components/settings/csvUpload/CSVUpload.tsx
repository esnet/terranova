import * as React from "react";
import { setAuthHeaders } from "../../../DataController";
import { API_URL } from "../../../../static/settings";
import { Accordion } from "../../Accordion";
import { UploadCSVModal } from "./UploadCSVModal";
import { DeleteCSVModal } from "./DeleteCSVModal";
import { CSVDatasetCard } from "./CSVDatasetCard";
import { Plus } from "lucide-react";
import Card from "../../Card";

export function CSVUploadSettings() {
    const [datasets, setDatasets] = React.useState<any[]>([]);
    const [showUploadModal, setShowUploadModal] = React.useState(false);
    const [showDeleteModal, setShowDeleteModal] = React.useState(false);
    const [datasetToDelete, setDatasetToDelete] = React.useState<any>(null);

    async function fetchDatasets() {
        const headers = setAuthHeaders({ "Content-Type": "application/json" });
        const response = await fetch(`${API_URL}/csv/?limit=9999`, { headers, method: "GET" });
        if (response.ok) {
            const data = await response.json();
            setDatasets(data);
        }
    }

    React.useEffect(() => {
        fetchDatasets();
    }, []);

    async function handleUpload(name: string, nodesFile: File, edgesFile: File) {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("nodes_file", nodesFile);
        formData.append("edges_file", edgesFile);

        const headers = setAuthHeaders({});
        const response = await fetch(`${API_URL}/csv/`, {
            headers,
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(body.detail || `Upload failed (HTTP ${response.status})`);
        }

        await fetchDatasets();
    }

    async function handleDelete() {
        setShowDeleteModal(false);
        if (!datasetToDelete) return;
        const headers = setAuthHeaders({});
        await fetch(`${API_URL}/csv/${datasetToDelete.csv_id}/`, { headers, method: "DELETE" });
        setDatasetToDelete(null);
        await fetchDatasets();
    }

    return (
        <div className="w-full">
            <UploadCSVModal
                visible={showUploadModal}
                setVisible={setShowUploadModal}
                onUpload={handleUpload}
            />

            <DeleteCSVModal
                visible={showDeleteModal}
                setVisible={setShowDeleteModal}
                onConfirm={handleDelete}
                name={datasetToDelete?.csv_name}
            />

            <Accordion header="CSV Upload Datasources">
                <fieldset className="w-full">
                    <legend className="text-lg">Upload CSV topology data</legend>
                    <div className="mb-4 tn-text">
                        <p>Create a datasource by uploading a Nodes CSV and an Edges CSV.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        {datasets.map((dataset) => (
                            <CSVDatasetCard
                                key={dataset.csv_id}
                                dataset={dataset}
                                onDelete={() => {
                                    setDatasetToDelete(dataset);
                                    setShowDeleteModal(true);
                                }}
                            />
                        ))}

                        <button
                            type="button"
                            className="block cursor-pointer w-full h-fit rounded-lg hover:text-dark-primary transition duration-150"
                            onClick={() => setShowUploadModal(true)}
                        >
                            <Card className="flex flex-col items-center justify-center gap-2">
                                <div className="flex gap-2 text-lg font-medium">
                                    <Plus />
                                    Upload CSV Dataset
                                </div>
                                <span className="text-inherit/80">Nodes + Edges CSV files</span>
                            </Card>
                        </button>
                    </div>
                </fieldset>
            </Accordion>
        </div>
    );
}
