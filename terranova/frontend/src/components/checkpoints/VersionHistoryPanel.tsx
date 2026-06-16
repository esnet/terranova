import React, { useEffect, useState, useCallback } from "react";
import { X, Clock, User, Cpu } from "lucide-react";
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

function DeltaSummary({ delta }: { delta: Delta | null }) {
    if (!delta || !delta.changed) return null;
    return (
        <span className="text-[10px] text-color-text-alt mt-0.5 truncate block">
            {delta.summary}
        </span>
    );
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
                <div className="flex items-center gap-2 text-sm font-semibold">
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
                    const delta = idx < versions.length - 1 ? (deltas[v.version] ?? null) : null;
                    const isCheckpoint = !!v.checkpoint;

                    return (
                        <button
                            key={v.version}
                            className={`w-full text-left px-3 py-2.5 transition-colors border-b border-color-border-alt
                                ${isSelected
                                    ? "bg-light-secondary text-white"
                                    : "hover:bg-color-layer-2 text-color-text"
                                }`}
                            onClick={() => handleSelect(v, idx)}
                        >
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className={`text-xs font-mono font-bold shrink-0 ${isSelected ? "text-white" : "text-color-text-alt"}`}>
                                    v{v.version}
                                </span>

                                {isCheckpoint ? (
                                    <span className={`flex items-center gap-0.5 text-[10px] px-1 py-0.5 rounded font-semibold shrink-0
                                        ${isSelected ? "bg-white/20 text-white" : "bg-mauve-100 text-mauve-700"}`}>
                                        <Cpu size={8} /> auto
                                    </span>
                                ) : (
                                    <span className={`flex items-center gap-0.5 text-[10px] px-1 py-0.5 rounded font-semibold shrink-0
                                        ${isSelected ? "bg-white/20 text-white" : "bg-color-layer-3 text-color-text-alt"}`}>
                                        <User size={8} /> user
                                    </span>
                                )}

                                {isCurrent && (
                                    <span className={`text-[10px] px-1 py-0.5 rounded font-semibold shrink-0
                                        ${isSelected ? "bg-white/20 text-white" : "bg-color-bg-success text-color-text-success"}`}>
                                        current
                                    </span>
                                )}
                            </div>

                            <div className={`mt-0.5 text-[11px] flex items-center gap-1 truncate ${isSelected ? "text-white/70" : "text-color-text-alt"}`}>
                                <span>{fmt(v.lastUpdatedOn)}</span>
                                <span className="opacity-40">·</span>
                                <span className="truncate">{v.lastUpdatedBy}</span>
                            </div>

                            {isSelected && <DeltaSummary delta={delta} />}
                        </button>
                    );
                })}
            </div>

            <div className="px-3 py-2 text-[10px] text-color-text-alt border-t border-color-border-alt shrink-0">
                Click a version to compare it against the previous one.
            </div>
        </div>
    );
}
