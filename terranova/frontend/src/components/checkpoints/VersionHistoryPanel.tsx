import React, { useEffect, useState, useCallback } from "react";
import { X, Clock } from "lucide-react";
import { PktsChip } from "@esnet/packets-ui-react";
import { setAuthHeaders } from "../../DataController";
import { API_URL } from "../../../static/settings";

interface VersionEntry {
    datasetId: string;
    version: number;
    lastUpdatedBy: string;
    lastUpdatedOn: string;
    checkpoint: boolean | null;
    name: string;
}

interface Delta {
    changed: boolean;
    summary: string;
    nodes: { added: any[]; removed: any[]; modified: any[] };
    edges: { added: any[]; removed: any[]; modified: any[] };
}

interface VersionHistoryPanelProps {
    datasetId: string;
    currentVersion: number;
    onClose: () => void;
    onSelectVersion: (version: number, delta: Delta | null) => void;
}

function fmt(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function VersionHistoryPanel({
    datasetId,
    currentVersion,
    onClose,
    onSelectVersion,
}: VersionHistoryPanelProps) {
    const [versions, setVersions] = useState<VersionEntry[]>([]);
    const [deltas, setDeltas] = useState<Record<number, Delta | null>>({});
    const [selected, setSelected] = useState<number>(currentVersion);
    const [loading, setLoading] = useState(true);

    const fetchVersions = useCallback(async () => {
        setLoading(true);
        const headers = setAuthHeaders({ "Content-Type": "application/json" });
        const res = await fetch(`${API_URL}/dataset/id/${datasetId}/versions/`, { headers });
        if (res.ok) {
            const data: VersionEntry[] = await res.json();
            data.sort((a, b) => b.version - a.version);
            setVersions(data);
            for (let i = 0; i < data.length - 1; i++) {
                fetchDelta(data[i + 1].version, data[i].version);
            }
        }
        setLoading(false);
    }, [datasetId]);

    const fetchDelta = useCallback(
        async (v1: number, v2: number) => {
            const key = v2;
            if (deltas[key] !== undefined) return;
            const headers = setAuthHeaders({ "Content-Type": "application/json" });
            const res = await fetch(`${API_URL}/dataset/id/${datasetId}/diff/${v1}/${v2}/`, { headers });
            if (res.ok) {
                const data: { delta: Delta } = await res.json();
                setDeltas((prev) => ({ ...prev, [key]: data.delta }));
            }
        },
        [datasetId, deltas],
    );

    useEffect(() => { fetchVersions(); }, []);

    const handleSelect = (v: VersionEntry, idx: number) => {
        setSelected(v.version);
        const delta = idx < versions.length - 1 ? (deltas[v.version] ?? null) : null;
        onSelectVersion(v.version, delta);
    };

    return (
        <div
            className="fixed right-0 top-0 h-full w-72 bg-color-layer-1 border-l border-color-border-alt shadow-2xl z-700 flex flex-col"
            style={{ animation: "slideInRight 200ms ease-out" }}
        >
            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to   { transform: translateX(0);    opacity: 1; }
                }
            `}</style>

            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-color-border-alt bg-light-secondary text-white shrink-0">
                <div className="flex items-center gap-2 tn-bold text-sm">
                    <Clock size={13} />
                    Version History
                </div>
                <button onClick={onClose} className="hover:opacity-70 transition-opacity">
                    <X size={15} />
                </button>
            </div>

            {/* Version list */}
            <div className="flex-1 overflow-y-auto">
                {loading && (
                    <div className="p-4 text-sm text-color-text-alt text-center">Loading…</div>
                )}
                {!loading && versions.length === 0 && (
                    <div className="p-4 text-sm text-color-text-alt text-center">No versions found.</div>
                )}
                {versions.map((v, idx) => {
                    const isSelected = v.version === selected;
                    const isCurrent = v.version === currentVersion;
                    const isCheckpoint = !!v.checkpoint;
                    const delta = idx < versions.length - 1 ? (deltas[v.version] ?? null) : null;

                    return (
                        <button
                            key={v.version}
                            onClick={() => handleSelect(v, idx)}
                            className={`w-full text-left px-3 py-2 border-b border-color-border-alt transition-colors
                                ${isSelected
                                    ? "bg-color-layer-1"
                                    : "bg-color-layer-3 hover:bg-color-layer-2"
                                }`}
                        >
                            {/* Version number + chips row */}
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className="tn-bold font-mono text-xs text-color-text shrink-0">
                                    v{v.version}
                                </span>

                                {/* Scheduled snapshot chip */}
                                {isCheckpoint && (
                                    <PktsChip variant="outline" className="!text-[10px] !py-0 !px-1.5 !h-auto">
                                        scheduled
                                    </PktsChip>
                                )}

                                {/* Current version chip */}
                                {isCurrent && (
                                    <PktsChip variant="primary" className="!text-[10px] !py-0 !px-1.5 !h-auto">
                                        current
                                    </PktsChip>
                                )}
                            </div>

                            {/* Timestamp + author */}
                            <div className="mt-0.5 text-xs text-color-text-alt tn-text truncate">
                                {fmt(v.lastUpdatedOn)}
                                <span className="opacity-40 mx-1">·</span>
                                {v.lastUpdatedBy}
                            </div>

                            {/* Inline delta summary when selected */}
                            {isSelected && delta?.changed && (
                                <div className="mt-1 text-xs text-color-text-alt tn-text">
                                    {delta.summary}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="px-3 py-2 text-xs text-color-text-alt tn-text border-t border-color-border-alt shrink-0">
                Click a version to compare it against the previous one.
            </div>
        </div>
    );
}
