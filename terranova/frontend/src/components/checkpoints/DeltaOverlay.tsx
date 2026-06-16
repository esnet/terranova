import React from "react";
import { X, Eye, EyeOff } from "lucide-react";

interface Delta {
    changed: boolean;
    summary: string;
    nodes: { added: any[]; removed: any[]; modified: any[] };
    edges: { added: any[]; removed: any[]; modified: any[] };
}

export interface DeltaLayers {
    added: boolean;
    removed: boolean;
    modified: boolean;
}

interface DeltaOverlayProps {
    delta: Delta;
    fromVersion?: number;  // kept for map mode
    toVersion?: number;    // kept for map mode
    fromSnapshotId?: string;  // for dataset mode
    toSnapshotId?: string;    // for dataset mode
    onDismiss: () => void;
    // "map" = text summary only; "dataset" = show layer toggles
    mode?: "map" | "dataset";
    layers?: DeltaLayers;
    onToggleLayer?: (layer: keyof DeltaLayers) => void;
}

const LAYER_COLORS = {
    added:    { bg: "#22c55e", text: "#166534", chipBg: "#dcfce7" },
    removed:  { bg: "#ef4444", text: "#991b1b", chipBg: "#fee2e2" },
    modified: { bg: "#f59e0b", text: "#92400e", chipBg: "#fef3c7" },
} as const;

function LayerToggle({
    label,
    count,
    active,
    colors,
    onToggle,
}: {
    label: string;
    count: number;
    active: boolean;
    colors: { bg: string; text: string; chipBg: string };
    onToggle: () => void;
}) {
    if (count === 0) return null;
    return (
        <button
            onClick={onToggle}
            className="flex items-center gap-1.5 px-2 py-1 rounded transition-all text-xs font-semibold select-none"
            style={{
                backgroundColor: active ? colors.chipBg : "#f3f4f6",
                color: active ? colors.text : "#9ca3af",
                opacity: active ? 1 : 0.7,
            }}
            title={active ? `Hide ${label}` : `Show ${label}`}
        >
            {active
                ? <Eye size={11} style={{ color: colors.bg }} />
                : <EyeOff size={11} />
            }
            <span>{count} {label}</span>
        </button>
    );
}

export function DeltaOverlay({
    delta,
    fromVersion,
    toVersion,
    fromSnapshotId,
    toSnapshotId,
    onDismiss,
    mode = "map",
    layers,
    onToggleLayer,
}: DeltaOverlayProps) {
    const headerLabel = fromSnapshotId
        ? `${fromSnapshotId.slice(0, 6)}… → ${toSnapshotId?.slice(0, 6)}…`
        : `v${fromVersion} → v${toVersion}`;
    const addedCount    = delta.nodes.added.length    + delta.edges.added.length;
    const removedCount  = delta.nodes.removed.length  + delta.edges.removed.length;
    const modifiedCount = delta.nodes.modified.length + delta.edges.modified.length;

    return (
        <div
            className="absolute bottom-4 left-4 z-600 max-w-xs"
            style={{ animation: "fadeUp 200ms ease-out" }}
        >
            <style>{`
                @keyframes fadeUp {
                    from { transform: translateY(8px); opacity: 0; }
                    to   { transform: translateY(0);   opacity: 1; }
                }
            `}</style>

            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between gap-4 px-3 py-2 bg-light-secondary text-white">
                    <span className="text-xs font-semibold tracking-wide">
                        {headerLabel}
                    </span>
                    <button onClick={onDismiss} className="hover:opacity-70 transition-opacity shrink-0" aria-label="Dismiss diff">
                        <X size={13} />
                    </button>
                </div>

                <div className="px-3 py-2.5 flex flex-col gap-2">
                    {/* Summary text — always shown */}
                    {!delta.changed ? (
                        <p className="text-xs text-color-text-alt italic">No changes detected.</p>
                    ) : (
                        <p className="text-xs text-color-text">{delta.summary}</p>
                    )}

                    {/* Layer toggles — dataset mode only */}
                    {mode === "dataset" && delta.changed && layers && onToggleLayer && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <LayerToggle
                                label="added"
                                count={addedCount}
                                active={layers.added}
                                colors={LAYER_COLORS.added}
                                onToggle={() => onToggleLayer("added")}
                            />
                            <LayerToggle
                                label="removed"
                                count={removedCount}
                                active={layers.removed}
                                colors={LAYER_COLORS.removed}
                                onToggle={() => onToggleLayer("removed")}
                            />
                            <LayerToggle
                                label="modified"
                                count={modifiedCount}
                                active={layers.modified}
                                colors={LAYER_COLORS.modified}
                                onToggle={() => onToggleLayer("modified")}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
