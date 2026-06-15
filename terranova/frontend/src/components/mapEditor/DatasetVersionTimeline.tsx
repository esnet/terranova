import React, { useEffect, useState, useCallback } from "react";
import { Info } from "lucide-react";
import { setAuthHeaders } from "../../DataController";
import { API_URL } from "../../../static/settings";
import { PktsInputRow, PktsInputSelect, PktsInputOption } from "@esnet/packets-ui-react";

interface VersionEntry {
    datasetId: string;
    version: number;
    lastUpdatedBy: string;
    lastUpdatedOn: string;
    checkpoint: boolean | null;
}

interface DatasetVersionTimelineProps {
    datasetId: string | undefined;
    selectedVersion: string;  // "live-latest", "snapshot-latest", or "static-N"
    onChange: (liveOrStatic: string, version: string) => void;
}

function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric", month: "2-digit", day: "2-digit",
    });
}

// Two-button toggle matching the widget aesthetic
function ToggleRow({
    leftLabel, leftSub,
    rightLabel, rightSub,
    leftActive,
    onLeft, onRight,
}: {
    leftLabel: string; leftSub: string;
    rightLabel: string; rightSub: string;
    leftActive: boolean;
    onLeft: () => void; onRight: () => void;
}) {
    const activeClass = "bg-light-secondary text-white";
    const idleClass = "bg-color-layer-2 hover:bg-color-layer-3 text-color-text border border-color-border-alt";

    return (
        <div className="flex rounded overflow-hidden w-full text-sm">
            <button
                onClick={onLeft}
                className={`flex-1 flex items-center justify-between px-3 py-1.5 transition-colors ${leftActive ? activeClass : idleClass} rounded-l`}
            >
                <span className="font-medium">{leftLabel}</span>
                <span className={`text-xs ${leftActive ? "opacity-60" : "text-color-text-alt"}`}>{leftSub}</span>
            </button>
            <button
                onClick={onRight}
                className={`flex-1 flex items-center justify-between px-3 py-1.5 transition-colors ${!leftActive ? activeClass : idleClass} rounded-r border-l-0`}
            >
                <span className="font-medium">{rightLabel}</span>
                <span className={`text-xs ${!leftActive ? "opacity-60" : "text-color-text-alt"}`}>{rightSub}</span>
            </button>
        </div>
    );
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
    const isHistoric = !isLive && !isSnapshot;
    const selectedVersionNum = isHistoric
        ? parseInt(selectedVersion.replace("static-", ""))
        : null;

    if (!datasetId) return null;

    // Determine the value for the select: use selected version num if historic, else the most recent
    const selectValue = isHistoric && selectedVersionNum
        ? String(selectedVersionNum)
        : versions[0] ? String(versions[0].version) : "";

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onChange("static", e.target.value);
    };

    return (
        <div className="flex flex-col gap-2">
            {/* Label with info tooltip */}
            <div className="flex items-center gap-1">
                <span className="text-sm text-color-text font-medium">Dataset Version</span>
                <span className="relative group">
                    <Info size={12} className="text-color-text-alt cursor-help" />
                    <span className="pointer-events-none absolute left-5 top-0 z-50 w-64 rounded bg-esnetblack-800 text-esnetwhite-50 text-xs px-2.5 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 leading-snug">
                        Live always reflects current data. Latest Snapshot uses the most recently saved version.
                        Historical lets you pick any past version and shows what changed.
                    </span>
                </span>
            </div>

            {/* Live / Latest Snapshot toggle */}
            <ToggleRow
                leftLabel="Live"
                leftSub="dynamic"
                rightLabel="Latest Snapshot"
                rightSub="most recent"
                leftActive={isLive || (!isSnapshot && !isHistoric)}
                onLeft={() => onChange("live", "latest")}
                onRight={() => onChange("snapshot", "latest")}
            />

            {/* Historical Version dropdown */}
            <PktsInputRow label="Historical Version">
                <PktsInputSelect
                    name="historical-version"
                    value={isHistoric ? selectValue : ""}
                    onChange={handleSelectChange}
                    disabled={loading || versions.length === 0}
                >
                    {/* Placeholder when not in historic mode */}
                    {!isHistoric && (
                        <PktsInputOption value="" key="placeholder">
                            — select a version —
                        </PktsInputOption>
                    )}
                    {versions.map((v) => (
                        <PktsInputOption key={String(v.version)} value={String(v.version)}>
                            {`v${v.version}${v.checkpoint ? " · auto" : ""}  ${fmtDate(v.lastUpdatedOn)}`}
                        </PktsInputOption>
                    ))}
                </PktsInputSelect>
            </PktsInputRow>
        </div>
    );
}
