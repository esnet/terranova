import React, { useEffect, useState, useCallback } from "react";
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

    const selectValue = isLive ? "live-latest"
        : isSnapshot ? "snapshot-latest"
        : `static-${selectedVersionNum}`;

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === "live-latest") onChange("live", "latest");
        else if (val === "snapshot-latest") onChange("snapshot", "latest");
        else if (val.startsWith("static-")) onChange("static", val.replace("static-", ""));
    };

    if (!datasetId) return null;

    return (
        <PktsInputRow
            label="Dataset Version"
            tooltip="Live Query always reflects current data. Last Snapshot uses the most recently saved version. Historical versions show a point-in-time snapshot and display a diff overlay on the map."
        >
            <PktsInputSelect
                name="dataset-version"
                value={selectValue}
                onChange={handleChange}
                disabled={loading}
            >
                <PktsInputOption value="live-latest">Live Query</PktsInputOption>
                <PktsInputOption value="snapshot-latest">Last Snapshot</PktsInputOption>
                {versions.length > 0 && (
                    <PktsInputOption value="" disabled>
                        {"── Historical ──"}
                    </PktsInputOption>
                )}
                {versions.map((v) => (
                    <PktsInputOption key={String(v.version)} value={`static-${v.version}`}>
                        {`v${v.version}${v.checkpoint ? " · auto" : ""}  ${fmtDate(v.lastUpdatedOn)}`}
                    </PktsInputOption>
                ))}
            </PktsInputSelect>
        </PktsInputRow>
    );
}
