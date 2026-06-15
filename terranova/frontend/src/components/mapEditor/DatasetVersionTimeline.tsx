import React, { useEffect, useState, useCallback } from "react";
import { Cpu, User, Radio, Clock } from "lucide-react";
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

interface DatasetVersionTimelineProps {
    datasetId: string | undefined;
    selectedVersion: string;
    onChange: (liveOrStatic: string, version: string) => void;
}

function relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    if (d < 7) return `${d}d ago`;
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function absTime(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

export function DatasetVersionTimeline({
    datasetId,
    selectedVersion,
    onChange,
}: DatasetVersionTimelineProps) {
    const [versions, setVersions] = useState<VersionEntry[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchVersions = useCallback(async () => {
        if (!datasetId) return;
        setLoading(true);
        const headers = setAuthHeaders({ "Content-Type": "application/json" });
        const res = await fetch(`${API_URL}/dataset/id/${datasetId}/versions/`, { headers });
        if (res.ok) {
            const data: VersionEntry[] = await res.json();
            data.sort((a, b) => b.version - a.version);
            setVersions(data);
        }
        setLoading(false);
    }, [datasetId]);

    useEffect(() => { fetchVersions(); }, [fetchVersions]);

    const isLive = selectedVersion === "live" || selectedVersion === "live-latest";
    const isSnapshot = selectedVersion === "snapshot-latest";
    const selectedVersionNum = !isLive && !isSnapshot
        ? parseInt(selectedVersion.replace("static-", ""))
        : null;

    if (!datasetId) return null;

    return (
        <div className="flex flex-col gap-0" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>

            {/* Section header */}
            <div className="flex items-center gap-2 mb-2">
                <Clock size={11} className="text-gray-400" />
                <span className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">
                    Data Source
                </span>
            </div>

            {/* Live row */}
            <button
                onClick={() => onChange("live", "latest")}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all duration-150 text-left w-full
                    ${isLive
                        ? "bg-emerald-500 shadow-sm"
                        : "hover:bg-gray-100 bg-gray-50 border border-gray-200"
                    }`}
            >
                {/* Pulse indicator for live */}
                <span className="relative flex shrink-0">
                    <span className={`w-2 h-2 rounded-full ${isLive ? "bg-white" : "bg-emerald-400"}`} />
                    {isLive && (
                        <span className="absolute inset-0 rounded-full bg-white animate-ping opacity-75" />
                    )}
                </span>
                <span className={`text-[11px] font-bold tracking-wide ${isLive ? "text-white" : "text-gray-700"}`}>
                    LIVE
                </span>
                <span className={`ml-auto text-[10px] tracking-wide ${isLive ? "text-emerald-100" : "text-gray-400"}`}>
                    dynamic
                </span>
            </button>

            {/* Latest snapshot row */}
            <button
                onClick={() => onChange("snapshot", "latest")}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg mb-2 transition-all duration-150 text-left w-full
                    ${isSnapshot
                        ? "bg-blue-500 shadow-sm"
                        : "hover:bg-gray-100 bg-gray-50 border border-gray-200"
                    }`}
            >
                <span className={`w-2 h-2 rounded-full shrink-0 ${isSnapshot ? "bg-white" : "bg-blue-400"}`} />
                <span className={`text-[11px] font-bold tracking-wide ${isSnapshot ? "text-white" : "text-gray-700"}`}>
                    LATEST SNAPSHOT
                </span>
                <span className={`ml-auto text-[10px] tracking-wide ${isSnapshot ? "text-blue-100" : "text-gray-400"}`}>
                    most recent
                </span>
            </button>

            {/* Divider + version list header */}
            {versions.length > 0 && (
                <div className="flex items-center gap-2 mb-1.5">
                    <div className="h-px bg-gray-200 flex-1" />
                    <span className="text-[9px] tracking-widest uppercase text-gray-400 font-semibold">
                        Version History
                    </span>
                    <div className="h-px bg-gray-200 flex-1" />
                </div>
            )}

            {/* Version entries with timeline connector */}
            {loading && (
                <div className="px-3 py-3 text-[11px] text-gray-400 tracking-wide">
                    Loading…
                </div>
            )}

            {!loading && (
                <div className="relative flex flex-col">
                    {/* Vertical connector line */}
                    {versions.length > 1 && (
                        <div
                            className="absolute left-[19px] top-4 bottom-4 w-px bg-gray-200"
                            style={{ zIndex: 0 }}
                        />
                    )}

                    {versions.map((v, idx) => {
                        const isSelected = selectedVersionNum === v.version;
                        const isCheckpoint = !!v.checkpoint;
                        const isFirst = idx === 0;

                        return (
                            <button
                                key={v.version}
                                onClick={() => onChange("static", String(v.version))}
                                className={`relative flex items-start gap-3 px-3 py-2 mb-0.5 rounded-lg transition-all duration-150 text-left w-full group
                                    ${isSelected
                                        ? "bg-gray-800 shadow-sm"
                                        : "hover:bg-gray-50"
                                    }`}
                                style={{ zIndex: 1 }}
                            >
                                {/* Timeline dot */}
                                <span
                                    className={`relative flex items-center justify-center w-5 h-5 rounded-full shrink-0 mt-0.5
                                        border-2 transition-colors
                                        ${isSelected
                                            ? "bg-gray-800 border-gray-500"
                                            : isCheckpoint
                                                ? "bg-white border-violet-400"
                                                : "bg-white border-gray-300 group-hover:border-gray-400"
                                        }`}
                                >
                                    {isCheckpoint
                                        ? <Cpu size={9} className={isSelected ? "text-violet-400" : "text-violet-500"} />
                                        : <User size={9} className={isSelected ? "text-gray-400" : "text-gray-400"} />
                                    }
                                </span>

                                <span className="flex flex-col min-w-0 flex-1">
                                    <span className="flex items-center gap-2">
                                        <span className={`text-[11px] font-bold tabular-nums ${isSelected ? "text-white" : "text-gray-700"}`}>
                                            v{v.version}
                                        </span>
                                        {isFirst && !isSelected && (
                                            <span className="text-[9px] px-1 py-0.5 rounded bg-gray-100 text-gray-500 font-semibold tracking-wide">
                                                LATEST
                                            </span>
                                        )}
                                        {isCheckpoint && (
                                            <span className={`text-[9px] px-1 py-0.5 rounded font-semibold tracking-wide
                                                ${isSelected ? "bg-violet-900/40 text-violet-300" : "bg-violet-50 text-violet-600"}`}>
                                                AUTO
                                            </span>
                                        )}
                                    </span>
                                    <span className={`text-[10px] tabular-nums truncate ${isSelected ? "text-gray-400" : "text-gray-400"}`}
                                        title={absTime(v.lastUpdatedOn)}>
                                        {relativeTime(v.lastUpdatedOn)} · {v.lastUpdatedBy}
                                    </span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {!loading && versions.length === 0 && (
                <div className="px-3 py-3 text-[11px] text-gray-400 tracking-wide italic">
                    No saved versions yet.
                </div>
            )}
        </div>
    );
}
