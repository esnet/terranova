import React from "react";
import { PktsButton, PktsInputRow, PktsInputText, PktsAlert } from "@esnet/packets-ui-react";
import { Upload, X } from "lucide-react";
import { ModalDialog } from "../../ModalDialog";

const EXAMPLE_SHEET_URL =
    "https://docs.google.com/spreadsheets/d/191BuMoWa2CooMXJQzyNtBRlNLHamBmh-8PCoIGDELxA/edit";

interface UploadCSVModalProps {
    visible: boolean;
    setVisible: React.Dispatch<React.SetStateAction<boolean>>;
    onUpload: (name: string, nodesFile: File, edgesFile: File) => Promise<void>;
}

export function UploadCSVModal({ visible, setVisible, onUpload }: UploadCSVModalProps) {
    const [name, setName] = React.useState("");
    const [nodesFile, setNodesFile] = React.useState<File | null>(null);
    const [edgesFile, setEdgesFile] = React.useState<File | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [uploading, setUploading] = React.useState(false);

    const reset = () => {
        setName("");
        setNodesFile(null);
        setEdgesFile(null);
        setError(null);
        setUploading(false);
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            setError("Please enter a dataset name.");
            return;
        }
        if (!nodesFile) {
            setError("Please select a Nodes CSV file.");
            return;
        }
        if (!edgesFile) {
            setError("Please select an Edges CSV file.");
            return;
        }
        setError(null);
        setUploading(true);
        try {
            await onUpload(name.trim(), nodesFile, edgesFile);
            reset();
            setVisible(false);
        } catch (e: any) {
            setError(e.message || "Upload failed. Please check your CSV files and try again.");
            setUploading(false);
        }
    };

    const footer = (
        <div className="flex gap-2 justify-end">
            <PktsButton
                className="w-fit!"
                variant="secondary"
                onClick={() => { reset(); setVisible(false); }}
                disabled={uploading}
            >
                <span className="flex items-center gap-2"><X /> Cancel</span>
            </PktsButton>
            <PktsButton
                className="w-fit!"
                variant="primary"
                onClick={handleSubmit}
                disabled={uploading}
            >
                <span className="flex items-center gap-2">
                    <Upload /> {uploading ? "Uploading…" : "Upload"}
                </span>
            </PktsButton>
        </div>
    );

    return (
        <ModalDialog visible={visible} setVisible={setVisible} header="Upload CSV Dataset" footer={footer}>
            <div className="flex flex-col gap-4">
                {error && (
                    <PktsAlert variant="error" title="Upload Error">
                        {error}
                    </PktsAlert>
                )}

                <PktsInputRow label="Dataset Name">
                    <PktsInputText
                        name="name"
                        placeholder="My Network Topology"
                        value={name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                    />
                </PktsInputRow>

                <p className="text-sm tn-text">
                    See{" "}
                    <a href={EXAMPLE_SHEET_URL} target="_blank" rel="noreferrer">
                        example spreadsheet
                    </a>{" "}
                    for examples. (<em>File → Download → CSV</em> for both sheets.)
                </p>

                <PktsInputRow label="Nodes CSV">
                    <input
                        type="file"
                        accept=".csv"
                        className="block w-full text-sm text-color-text file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-color-button-secondary file:text-white hover:file:bg-color-button-secondary-hover cursor-pointer"
                        onChange={(e) => setNodesFile(e.target.files?.[0] ?? null)}
                    />
                </PktsInputRow>
                <p className="text-sm text-color-text-alt">
                    Required columns: Name, Latitude, Longitude, Description
                </p>

                <PktsInputRow label="Edges CSV">
                    <input
                        type="file"
                        accept=".csv"
                        className="block w-full text-sm text-color-text file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-color-button-secondary file:text-white hover:file:bg-color-button-secondary-hover cursor-pointer"
                        onChange={(e) => setEdgesFile(e.target.files?.[0] ?? null)}
                    />
                </PktsInputRow>
                <p className="text-sm text-color-text-alt">
                    Required columns: Name, Description, Source, Destination
                </p>
            </div>
        </ModalDialog>
    );
}
