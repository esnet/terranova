import React, { useEffect, useState, useCallback } from "react";
import { Cpu, User, Info } from "lucide-react";
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

    // Row base classes — matches PktsInputRow label sizing, surface color
    const rowBase = "flex items-center gap-2 px-2 py-1.5 rounded text-sm w-full text-left transition-colors cursor-pointer border border-transparent";
    const rowActive = "bg-light-secondary text-white";
    const rowIdle = "bg-color-layer-2 hover:bg-color-layer-3 text-color-text border-color-border-alt";

    return (
        <div className="flex flex-col gap-0.5">
            {/* Label row with info tooltip */}
            <div className="flex items-center gap-1 mb-1">
                <span className="text-sm text-color-text font-medium">Dataset Version</span>
                <span className="relative group">
                    <Info size={13} className="text-color-text-alt cursor-help" />
                    <span className="pointer-events-none absolute left-5 top-0 z-50 w-64 rounded bg-esnetblack-800 text-esnetwhite-50 text-xs px-2.5 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 leading-snug">
                        Live always reflects current data. Saved versions are point-in-time snapshots; auto-saved versions are marked <span className="font-semibold">AUTO</span>.
                    </span>
                </span>
            </div>

            {/* Live */}
            <button
                className={`${rowBase} ${isLive ? rowActive : rowIdle}`}
                onClick={() => onChange("live", "latest")}
            >
                <span className="relative flex items-center shrink-0">
                    <span className={`w-2 h-2 rounded-full ${isLive ? "bg-white" : "bg-color-text-success"}`} />
                    {isLive && <span className="absolute inset-0 rounded-full bg-white animate-ping opacity-60" />}
                </span>
                <span className="font-medium">Live</span>
                <span className={`ml-auto text-xs ${isLive ? "opacity-60" : "text-color-text-alt"}`}>dynamic</span>
            </button>

            {/* Latest snapshot */}
            <button
                className={`${rowBase} ${isSnapshot ? rowActive : rowIdle}`}
                onClick={() => onChange("snapshot", "latest")}
            >
                <span className={`w-2 h-2 rounded-full shrink-0 ${isSnapshot ? "bg-white" : "bg-esnetblue-200"}`} />
                <span className="font-medium">Latest Snapshot</span>
                <span className={`ml-auto text-xs ${isSnapshot ? "opacity-60" : "text-color-text-alt"}`}>most recent</span>
            </button>

            {/* Divider */}
            {(loading || versions.length > 0) && (
                <div className="flex items-center gap-1.5 my-1">
                    <div className="h-px bg-color-border-alt flex-1" />
                    <span className="text-[10px] uppercase tracking-widest text-color-text-alt font-semibold">History</span>
                    <div className="h-px bg-color-border-alt flex-1" />
                </div>
            )}

            {/* Scrollable version list — caps at ~6 rows */}
            <div className="flex flex-col gap-0.5 overflow-y-auto" style={{ maxHeight: "11rem" }}>
                {loading && (
                    <span className="px-2 py-1.5 text-sm text-color-text-alt italic">Loading…</span>
                )}
                {!loading && versions.map((v, idx) => {
                    const isSelected = selectedVersionNum === v.version;
                    const isCheckpoint = !!v.checkpoint;
                    return (
                        <button
                            key={v.version}
                            onClick={() => onChange("static", String(v.version))}
                            className={`${rowBase} ${isSelected ? rowActive : rowIdle}`}
                            title={absTime(v.lastUpdatedOn)}
                        >
                            {/* Timeline dot */}
                            <span className={`flex items-center justify-center w-4 h-4 rounded-full border shrink-0
                                ${isSelected
                                    ? "border-white/40 bg-white/10"
                                    : isCheckpoint
                                        ? "border-mauve-500 bg-mauve-50"
                                        : "border-color-border-alt bg-color-layer-1"
                                }`}>
                                {isCheckpoint
                                    ? <Cpu size={8} className={isSelected ? "text-white/80" : "text-mauve-600"} />
                                    : <User size={8} className="text-color-text-alt" />
                                }
                            </span>

                            {/* Version number */}
                            <span className={`font-mono text-xs font-bold tabular-nums shrink-0 ${isSelected ? "text-white" : "text-color-text"}`}>
                                v{v.version}
                            </span>

                            {/* Badges */}
                            {idx === 0 && !isSelected && (
                                <span className="text-[9px] px-1 rounded bg-color-layer-3 text-color-text-alt font-semibold tracking-wide uppercase shrink-0">
                                    latest
                                </span>
                            )}
                            {isCheckpoint && (
                                <span className={`text-[9px] px-1 rounded font-semibold tracking-wide uppercase shrink-0
                                    ${isSelected ? "bg-white/15 text-white/80" : "bg-mauve-100 text-mauve-700"}`}>
                                    auto
                                </span>
                            )}

                            {/* Timestamp */}
                            <span className={`ml-auto text-xs shrink-0 ${isSelected ? "text-white/60" : "text-color-text-alt"}`}>
                                {relativeTime(v.lastUpdatedOn)}
                            </span>
                        </button>
                    );
                })}
                {!loading && versions.length === 0 && (
                    <span className="px-2 py-1.5 text-sm text-color-text-alt italic">No saved versions.</span>
                )}
            </div>
        </div>
    );
}
