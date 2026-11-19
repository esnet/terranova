import React, { useEffect, useState, useCallback } from "react";
import { X, Clock, User, Cpu, ChevronRight } from "lucide-react";
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

function DeltaBadge({ delta }: { delta: Delta | null }) {
    if (!delta) return null;
    if (!delta.changed) {
        return (
            <span className="inline-block w-2 h-2 rounded-full bg-gray-300 ml-1 shrink-0" title="No change from previous" />
        );
    }
    return (
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 ml-1 shrink-0" title={delta.summary} />
    );
}

function DeltaSummaryCard({ delta }: { delta: Delta }) {
    if (!delta.changed) {
        return (
            <div className="text-xs text-gray-400 italic px-3 py-2">
                No changes from previous version.
            </div>
        );
    }
    const rows: { label: string; count: number; color: string }[] = [];
    if (delta.nodes.added.length)    rows.push({ label: "nodes added",    count: delta.nodes.added.length,    color: "text-emerald-600" });
    if (delta.nodes.removed.length)  rows.push({ label: "nodes removed",  count: delta.nodes.removed.length,  color: "text-red-500"     });
    if (delta.nodes.modified.length) rows.push({ label: "nodes modified", count: delta.nodes.modified.length, color: "text-amber-500"   });
    if (delta.edges.added.length)    rows.push({ label: "edges added",    count: delta.edges.added.length,    color: "text-emerald-600" });
    if (delta.edges.removed.length)  rows.push({ label: "edges removed",  count: delta.edges.removed.length,  color: "text-red-500"     });
    if (delta.edges.modified.length) rows.push({ label: "edges modified", count: delta.edges.modified.length, color: "text-amber-500"   });

    return (
        <div className="mx-3 mb-2 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-xs">
            <div className="font-semibold text-gray-600 mb-1">{delta.summary}</div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                {rows.map((r) => (
                    <span key={r.label} className={`${r.color} font-medium`}>
                        {r.count} {r.label}
                    </span>
                ))}
            </div>
        </div>
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
            // Descending by version number
            data.sort((a, b) => b.version - a.version);
            setVersions(data);
            // Prefetch deltas between consecutive versions
            for (let i = 0; i < data.length - 1; i++) {
                const newer = data[i].version;
                const older = data[i + 1].version;
                fetchDelta(older, newer);
            }
        }
        setLoading(false);
    }, [datasetId]);

    const fetchDelta = useCallback(
        async (v1: number, v2: number) => {
            const key = v2; // keyed by the newer version
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
            className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-2xl z-700 flex flex-col"
            style={{ animation: "slideInRight 200ms ease-out" }}
        >
            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to   { transform: translateX(0);    opacity: 1; }
                }
            `}</style>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-light-secondary text-white shrink-0">
                <div className="flex items-center gap-2 text-sm font-semibold tracking-wide">
                    <Clock size={14} />
                    Version History
                </div>
                <button onClick={onClose} className="hover:opacity-70 transition-opacity">
                    <X size={16} />
                </button>
            </div>

            {/* Version list */}
            <div className="flex-1 overflow-y-auto">
                {loading && (
                    <div className="p-4 text-sm text-gray-400 text-center">Loading…</div>
                )}
                {!loading && versions.length === 0 && (
                    <div className="p-4 text-sm text-gray-400 text-center">No versions found.</div>
                )}
                {versions.map((v, idx) => {
                    const isSelected = v.version === selected;
                    const isCurrent = v.version === currentVersion;
                    const delta = idx < versions.length - 1 ? (deltas[v.version] ?? null) : null;
                    const isCheckpoint = !!v.checkpoint;

                    return (
                        <div key={v.version}>
                            <button
                                className={`w-full text-left px-4 py-3 transition-colors border-b border-gray-50 group
                                    ${isSelected
                                        ? "bg-blue-50 border-l-2 border-l-blue-400"
                                        : "hover:bg-gray-50 border-l-2 border-l-transparent"
                                    }`}
                                onClick={() => handleSelect(v, idx)}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        {/* version number */}
                                        <span className="text-xs font-mono font-bold text-gray-500 shrink-0">
                                            v{v.version}
                                        </span>

                                        {/* checkpoint vs user badge */}
                                        {isCheckpoint ? (
                                            <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 font-semibold shrink-0">
                                                <Cpu size={9} /> auto
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-semibold shrink-0">
                                                <User size={9} /> user
                                            </span>
                                        )}

                                        {isCurrent && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold shrink-0">
                                                current
                                            </span>
                                        )}

                                        <DeltaBadge delta={delta} />
                                    </div>
                                    <ChevronRight
                                        size={14}
                                        className={`shrink-0 mt-0.5 transition-opacity ${isSelected ? "opacity-100 text-blue-400" : "opacity-0 group-hover:opacity-40"}`}
                                    />
                                </div>

                                <div className="mt-1 text-[11px] text-gray-400 flex items-center gap-1 truncate">
                                    <span>{fmt(v.lastUpdatedOn)}</span>
                                    <span className="text-gray-300">·</span>
                                    <span className="truncate">{v.lastUpdatedBy}</span>
                                </div>
                            </button>

                            {/* Delta summary shown inline below selected version */}
                            {isSelected && delta && (
                                <DeltaSummaryCard delta={delta} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2 text-[10px] text-gray-400 border-t border-gray-100 shrink-0">
                Click a version to preview it on the map. Changes are highlighted in the overlay.
            </div>
        </div>
    );
}
