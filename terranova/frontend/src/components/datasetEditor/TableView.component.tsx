import { PktsDataTable as PDT, PktsSpinner } from "@esnet/packets-ui-react";
import React from "react";
import { DeltaLayers } from "../checkpoints/DeltaOverlay";

interface Delta {
    changed: boolean;
    nodes: { added: any[]; removed: any[]; modified: any[] };
    edges: { added: any[]; removed: any[]; modified: any[] };
}

export interface TableViewProps {
    data: Record<string, any>[];
    loading?: boolean;
    datasetVisible?: boolean;
    delta?: Delta | null;
    deltaLayers?: DeltaLayers;
}

// Match the same key fields as the backend differ
const NODE_ID_FIELDS = ["endpoint_id", "node_id", "name", "id"];
const EDGE_ID_FIELDS = ["src", "dst"];

function recordKey(row: Record<string, any>): string {
    // Edge: src+dst
    if ("src" in row && "dst" in row) return `${row.src}->${row.dst}`;
    // Node: first matching id field
    for (const f of NODE_ID_FIELDS) {
        if (row[f] !== undefined) return String(row[f]);
    }
    return JSON.stringify(row);
}

function classifyRow(
    row: Record<string, any>,
    delta: Delta | null | undefined,
    layers: DeltaLayers | undefined,
): "added" | "removed" | "modified" | null {
    if (!delta?.changed || !layers) return null;
    const key = recordKey(row);
    const isEdge = "src" in row && "dst" in row;
    const group = isEdge ? delta.edges : delta.nodes;

    if (layers.added && group.added.some((r) => recordKey(r) === key)) return "added";
    if (layers.removed && group.removed.some((r) => recordKey(r) === key)) return "removed";
    if (layers.modified && group.modified.some((r) => recordKey(r.after ?? r) === key)) return "modified";
    return null;
}

const ROW_STYLES: Record<string, string> = {
    added:    "bg-green-50  border-l-2 border-l-green-400",
    removed:  "bg-red-50    border-l-2 border-l-red-400",
    modified: "bg-amber-50  border-l-2 border-l-amber-400",
};

export const TableView = ({ data, loading, datasetVisible, delta, deltaLayers }: TableViewProps) => {
    if (loading) {
        return (
            <div className="w-full h-full flex justify-center items-center">
                <PktsSpinner />
            </div>
        );
    }

    if (!Array.isArray(data) || data.length < 1 || !datasetVisible) {
        return (
            <div className="w-full h-full flex justify-center items-center">
                <span className="text-xl text-light-copyAlt">No data</span>
            </div>
        );
    }

    // When a diff is active and "removed" layer is on, merge removed records into the display
    const displayData = [...data];
    if (delta?.changed && deltaLayers?.removed) {
        const currentKeys = new Set(data.map(recordKey));
        const allRemoved = [...delta.nodes.removed, ...delta.edges.removed];
        for (const r of allRemoved) {
            if (!currentKeys.has(recordKey(r))) {
                displayData.push(r);
            }
        }
    }

    const headers = Object.keys(displayData[0]);

    return (
        <PDT>
            <PDT.PktsDataTableHead>
                {headers.map((key) => (
                    <PDT.PktsDataTableHeaderCell key={key} sort="NONE">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                    </PDT.PktsDataTableHeaderCell>
                ))}
            </PDT.PktsDataTableHead>

            <PDT.PktsDataTableBody>
                {displayData.map((row, rowIndex) => {
                    const classification = classifyRow(row, delta, deltaLayers);
                    const rowClass = classification ? ROW_STYLES[classification] : "";
                    return (
                        <PDT.PktsDataTableRow key={`row-${rowIndex}`} className={rowClass}>
                            {headers.map((key) => {
                                let value = row[key] ?? "N/A";
                                if (typeof value !== "string") value = JSON.stringify(value);
                                return (
                                    <PDT.PktsDataTableCell key={`${rowIndex}-${key}`}>
                                        {value}
                                    </PDT.PktsDataTableCell>
                                );
                            })}
                        </PDT.PktsDataTableRow>
                    );
                })}
            </PDT.PktsDataTableBody>
        </PDT>
    );
};
