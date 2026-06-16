// @ts-nocheck
import React, { useEffect, useState, useCallback, useRef } from "react";
import { setAuthHeaders } from "../../DataController";
import { API_URL } from "../../../static/settings";
import { PktsButton, PktsInputSelect, PktsInputOption, PktsInputRow } from "@esnet/packets-ui-react";
import { Loader2 } from "lucide-react";

interface Snapshot {
    snapshotId: string;
    snapshotType: string;  // "user_save" | "checkpoint"
    version: number | null;
    createdBy: string;
    createdOn: string;
}

interface DiffResult {
    base: any;
    added: any;
    removed: any;
    modified: any;
    summary: string;
    changed: boolean;
}

interface DatasetDiffPickerProps {
    datasetId: string;
    dataset: any;  // full dataset doc with pointer fields
    onCompare: (snap1Id: string, snap2Id: string, diffData: DiffResult, delta: any) => void;
    onAcknowledge: (snapshotId: string) => void;
    onAccept: (snapshotId: string) => void;
    onClose: () => void;
    hasActiveDiff: boolean;
    // Pre-populated from deep-link query params
    initialFromId?: string;
    initialToId?: string;
}

function fmtDate(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

function snapLabel(snap: Snapshot): string {
    const type = snap.snapshotType === "checkpoint" ? "auto" : `v${snap.version}`;
    return `${type}  ${fmtDate(snap.createdOn)}`;
}

export function DatasetDiffPicker({
    datasetId,
    dataset,
    onCompare,
    onAcknowledge,
    onAccept,
    onClose,
    hasActiveDiff,
    initialFromId,
    initialToId,
}: DatasetDiffPickerProps) {
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [loading, setLoading] = useState(true);
    const [comparing, setComparing] = useState(false);
    const [acting, setActing] = useState(false);

    // Default: compare latestCheckpoint (to) vs acknowledgedCheckpoint (from)
    const defaultTo   = dataset?.latestCheckpointId || "";
    const defaultFrom = dataset?.acknowledgedCheckpointId || "";

    const [toId, setToId]     = useState(initialToId   || defaultTo);
    const [fromId, setFromId] = useState(initialFromId || defaultFrom);

    const fetchSnapshots = useCallback(async () => {
        setLoading(true);
        const headers = setAuthHeaders({ "Content-Type": "application/json" });
        const res = await fetch(`${API_URL}/dataset/id/${datasetId}/snapshots/?limit=100`, { headers });
        if (res.ok) {
            const data: Snapshot[] = await res.json();
            setSnapshots(data);
            // If no selections yet and we have snapshots, set sensible defaults
            if (!toId && data.length > 0) {
                setToId(dataset?.latestCheckpointId || data[0].snapshotId);
            }
            if (!fromId && data.length > 1) {
                setFromId(dataset?.acknowledgedCheckpointId || data[1].snapshotId);
            }
        }
        setLoading(false);
    }, [datasetId]);

    useEffect(() => { fetchSnapshots(); }, []);

    // Auto-run compare when deep-linked
    useEffect(() => {
        if (initialFromId && initialToId && snapshots.length > 0) {
            handleCompare();
        }
    }, [snapshots.length]);

    const handleCompare = async () => {
        if (!fromId || !toId || fromId === toId) return;
        setComparing(true);
        try {
            const headers = setAuthHeaders({ "Content-Type": "application/json" });
            // Fetch diff topology
            const layout = "logical"; // caller decides actual layout; we just get the delta
            const diffRes = await fetch(
                `${API_URL}/output/dataset/${datasetId}/${layout}/diff/${fromId}/${toId}/`,
                { headers }
            );
            if (!diffRes.ok) return;
            const diffData = await diffRes.json();

            // Also fetch the record-level delta for the overlay summary
            const deltaRes = await fetch(
                `${API_URL}/dataset/id/${datasetId}/diff/${fromId}/${toId}/`,
                { headers }
            );
            const deltaData = deltaRes.ok ? await deltaRes.json() : null;

            onCompare(fromId, toId, diffData, deltaData?.delta || null);
        } finally {
            setComparing(false);
        }
    };

    const handleAcknowledge = async () => {
        setActing(true);
        try {
            const headers = setAuthHeaders({ "Content-Type": "application/json" });
            await fetch(`${API_URL}/dataset/id/${datasetId}/acknowledge/`, {
                method: "POST",
                headers,
                body: JSON.stringify({ snapshotId: toId }),
            });
            onAcknowledge(toId);
        } finally {
            setActing(false);
        }
    };

    const handleAccept = async () => {
        setActing(true);
        try {
            const headers = setAuthHeaders({ "Content-Type": "application/json" });
            await fetch(`${API_URL}/dataset/id/${datasetId}/accept/`, {
                method: "POST",
                headers,
                body: JSON.stringify({ snapshotId: toId }),
            });
            onAccept(toId);
        } finally {
            setActing(false);
        }
    };

    const canCompare = fromId && toId && fromId !== toId && !comparing;
    const canAct = hasActiveDiff && !acting;
    const hasUnreviewed = dataset?.latestCheckpointId &&
        dataset.latestCheckpointId !== dataset?.acknowledgedCheckpointId;

    return (
        <div className="absolute right-0 top-full mt-1 z-700 w-80 bg-color-layer-1 border border-color-border-alt rounded-xl shadow-xl p-4 flex flex-col gap-3">
            <div className="tn-bold text-sm text-color-text">Compare Snapshots</div>

            {hasUnreviewed && (
                <div className="text-xs text-color-text-warning bg-color-bg-warning rounded px-2 py-1">
                    Unreviewed checkpoint changes available.
                </div>
            )}

            {loading ? (
                <div className="flex items-center gap-2 text-sm text-color-text-alt">
                    <Loader2 size={14} className="animate-spin" /> Loading snapshots…
                </div>
            ) : (
                <>
                    <PktsInputRow label="From (older)">
                        <PktsInputSelect
                            name="diff-from"
                            value={fromId}
                            onChange={(e) => setFromId(e.target.value)}
                        >
                            {snapshots.map(s => (
                                <PktsInputOption key={s.snapshotId} value={s.snapshotId}>
                                    {snapLabel(s)}
                                </PktsInputOption>
                            ))}
                        </PktsInputSelect>
                    </PktsInputRow>

                    <PktsInputRow label="To (newer)">
                        <PktsInputSelect
                            name="diff-to"
                            value={toId}
                            onChange={(e) => setToId(e.target.value)}
                        >
                            {snapshots.map(s => (
                                <PktsInputOption key={s.snapshotId} value={s.snapshotId}>
                                    {snapLabel(s)}
                                </PktsInputOption>
                            ))}
                        </PktsInputSelect>
                    </PktsInputRow>

                    <PktsButton
                        variant="primary"
                        disabled={!canCompare}
                        onClick={handleCompare}
                        className="w-full flex items-center justify-center gap-1"
                    >
                        {comparing && <Loader2 size={13} className="animate-spin" />}
                        Compare
                    </PktsButton>

                    {hasActiveDiff && (
                        <div className="flex gap-2 pt-1 border-t border-color-border-alt">
                            <PktsButton
                                variant="secondary"
                                disabled={!canAct}
                                onClick={handleAcknowledge}
                                className="flex-1 flex items-center justify-center gap-1 text-xs"
                            >
                                {acting && <Loader2 size={11} className="animate-spin" />}
                                Mark Viewed
                            </PktsButton>
                            <PktsButton
                                variant="primary"
                                disabled={!canAct}
                                onClick={handleAccept}
                                className="flex-1 flex items-center justify-center gap-1 text-xs"
                            >
                                {acting && <Loader2 size={11} className="animate-spin" />}
                                Accept Changes
                            </PktsButton>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
