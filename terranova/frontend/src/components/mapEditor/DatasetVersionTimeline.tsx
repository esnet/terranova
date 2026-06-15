import React, { useEffect, useState, useCallback } from "react";
import { Cpu, User } from "lucide-react";
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
    selectedVersion: string;  // "live", "snapshot", or a numeric string
    onChange: (liveOrStatic: string, version: string) => void;
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
        <div className="flex flex-col text-xs border border-gray-200 rounded-lg overflow-hidden">
            {/* Live option */}
            <button
                className={`flex items-center gap-2 px-3 py-2 text-left transition-colors border-b border-gray-100
                    ${isLive ? "bg-light-secondary text-white" : "hover:bg-gray-50"}`}
                onClick={() => onChange("live", "latest")}
            >
                <span className={`w-2 h-2 rounded-full shrink-0 ${isLive ? "bg-white" : "bg-emerald-400"}`} />
                <span className="font-medium">Live (Dynamic)</span>
                <span className={`ml-auto text-[10px] ${isLive ? "text-white/70" : "text-gray-400"}`}>
                    always current
                </span>
            </button>

            {/* Snapshot option (latest saved) */}
            <button
                className={`flex items-center gap-2 px-3 py-2 text-left transition-colors border-b border-gray-100
                    ${isSnapshot ? "bg-light-secondary text-white" : "hover:bg-gray-50"}`}
                onClick={() => onChange("snapshot", "latest")}
            >
                <span className={`w-2 h-2 rounded-full shrink-0 ${isSnapshot ? "bg-white" : "bg-blue-400"}`} />
                <span className="font-medium">Latest Snapshot</span>
                <span className={`ml-auto text-[10px] ${isSnapshot ? "text-white/70" : "text-gray-400"}`}>
                    most recent save
                </span>
            </button>

            {/* Version list */}
            {loading && (
                <div className="px-3 py-2 text-gray-400 italic">Loading versions…</div>
            )}
            {!loading && versions.map((v) => {
                const isSelected = selectedVersionNum === v.version;
                const isCheckpoint = !!v.checkpoint;
                return (
                    <button
                        key={v.version}
                        className={`flex items-center gap-2 px-3 py-2 text-left transition-colors border-b border-gray-100 last:border-b-0
                            ${isSelected ? "bg-light-secondary text-white" : "hover:bg-gray-50"}`}
                        onClick={() => onChange("static", String(v.version))}
                    >
                        <span className={`font-mono font-bold shrink-0 ${isSelected ? "text-white/80" : "text-gray-400"}`}>
                            v{v.version}
                        </span>
                        {isCheckpoint ? (
                            <span className={`flex items-center gap-0.5 text-[10px] px-1 py-0.5 rounded font-semibold shrink-0
                                ${isSelected ? "bg-white/20 text-white" : "bg-violet-100 text-violet-700"}`}>
                                <Cpu size={8} /> auto
                            </span>
                        ) : (
                            <span className={`flex items-center gap-0.5 text-[10px] px-1 py-0.5 rounded font-semibold shrink-0
                                ${isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                                <User size={8} /> saved
                            </span>
                        )}
                        <span className={`ml-auto text-[10px] shrink-0 ${isSelected ? "text-white/70" : "text-gray-400"}`}>
                            {fmt(v.lastUpdatedOn)}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
