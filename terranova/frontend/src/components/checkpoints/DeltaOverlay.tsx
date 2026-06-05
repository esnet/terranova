import React from "react";
import { X, Circle } from "lucide-react";

interface Delta {
    changed: boolean;
    summary: string;
    nodes: { added: any[]; removed: any[]; modified: any[] };
    edges: { added: any[]; removed: any[]; modified: any[] };
}

interface DeltaOverlayProps {
    delta: Delta;
    fromVersion: number;
    toVersion: number;
    onDismiss: () => void;
}

function LegendDot({ color, label }: { color: string; label: string }) {
    return (
        <span className="flex items-center gap-1.5 text-xs text-gray-700">
            <span
                className="inline-block w-3 h-3 rounded-full border-2 shrink-0"
                style={{ borderColor: color, backgroundColor: `${color}33` }}
            />
            {label}
        </span>
    );
}

function CountChip({
    count,
    label,
    color,
}: {
    count: number;
    label: string;
    color: string;
}) {
    if (count === 0) return null;
    return (
        <span
            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${color}20`, color }}
        >
            {count} {label}
        </span>
    );
}

export function DeltaOverlay({ delta, fromVersion, toVersion, onDismiss }: DeltaOverlayProps) {
    const GREEN  = "#22c55e";
    const RED    = "#ef4444";
    const AMBER  = "#f59e0b";

    const totalChanges =
        delta.nodes.added.length +
        delta.nodes.removed.length +
        delta.nodes.modified.length +
        delta.edges.added.length +
        delta.edges.removed.length +
        delta.edges.modified.length;

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
                <div className="flex items-center justify-between gap-4 px-4 py-2.5 bg-gray-900 text-white">
                    <span className="text-xs font-semibold tracking-wide">
                        Diff: v{fromVersion} → v{toVersion}
                    </span>
                    <button
                        onClick={onDismiss}
                        className="hover:opacity-70 transition-opacity shrink-0"
                        aria-label="Dismiss diff overlay"
                    >
                        <X size={14} />
                    </button>
                </div>

                <div className="px-4 py-3 flex flex-col gap-2.5">
                    {/* Summary */}
                    {totalChanges === 0 ? (
                        <p className="text-xs text-gray-400 italic">No changes detected.</p>
                    ) : (
                        <>
                            <p className="text-xs text-gray-500">{delta.summary}</p>
                            <div className="flex flex-wrap gap-1.5">
                                <CountChip count={delta.nodes.added.length}    label="nodes added"    color={GREEN} />
                                <CountChip count={delta.nodes.removed.length}  label="nodes removed"  color={RED}   />
                                <CountChip count={delta.nodes.modified.length} label="nodes modified" color={AMBER} />
                                <CountChip count={delta.edges.added.length}    label="edges added"    color={GREEN} />
                                <CountChip count={delta.edges.removed.length}  label="edges removed"  color={RED}   />
                                <CountChip count={delta.edges.modified.length} label="edges modified" color={AMBER} />
                            </div>
                        </>
                    )}

                    {/* Legend */}
                    <div className="border-t border-gray-100 pt-2 flex flex-col gap-1">
                        <LegendDot color={GREEN} label="Added" />
                        <LegendDot color={RED}   label="Removed" />
                        <LegendDot color={AMBER} label="Modified" />
                    </div>
                </div>
            </div>
        </div>
    );
}
