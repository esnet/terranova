import React, { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Play, ChevronDown, ChevronUp, Loader2, Info } from "lucide-react";
import {
    PktsButton,
    PktsIconButton,
    PktsInputText,
    PktsInputSelect,
    PktsInputOption,
    PktsInputRow,
    PktsInputSwitch,
    PktsSpinner,
} from "@esnet/packets-ui-react";
import { setAuthHeaders } from "../../DataController";
import { API_URL } from "../../../static/settings";
import { Accordion } from "../Accordion";
import Card from "../Card";

// ─── Types ───────────────────────────────────────────────────────────────────

interface RetentionPolicy {
    keep_last_n: number | null;
    keep_every_nth: number | null;
}

interface CheckpointSchedule {
    scheduleId: string;
    datasetId: string;
    name: string;
    intervalMinutes: number;
    enabled: boolean;
    retention: RetentionPolicy;
    createdBy: string;
    createdOn: string;
    lastRunOn: string | null;
    lastRunStatus: string | null;
    lastError: string | null;
}

interface NotificationConfig {
    configId: string;
    scheduleId: string;
    emailRecipients: string[];
    slackWebhookUrl: string | null;
}

interface Dataset {
    datasetId: string;
    name: string;
}

// ─── Interval presets ────────────────────────────────────────────────────────

const INTERVAL_PRESETS = [
    { label: "Daily",             minutes: 1440 },
    { label: "Every 12 Hours",    minutes: 720  },
    { label: "Every 6 Hours",     minutes: 360  },
    { label: "Every 3 Hours",     minutes: 180  },
    { label: "Every Hour",        minutes: 60   },
    { label: "Every 30 Minutes",  minutes: 30   },
    { label: "Other",             minutes: null },
] as const;

function minutesToPreset(m: number): string {
    const found = INTERVAL_PRESETS.find(p => p.minutes === m);
    return found ? found.label : "Other";
}

function formatInterval(minutes: number): string {
    const preset = INTERVAL_PRESETS.find(p => p.minutes === minutes);
    return preset?.label ?? `Every ${minutes} min`;
}

// ─── API helpers ─────────────────────────────────────────────────────────────

async function apiFetch(path: string, opts: RequestInit = {}) {
    const headers = setAuthHeaders({ "Content-Type": "application/json" });
    const res = await fetch(`${API_URL}${path}`, { ...opts, headers });
    if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
    return res.json();
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string | null }) {
    if (!status) return null;
    const styles: Record<string, string> = {
        ok:      "bg-color-bg-success text-color-text-success",
        changed: "bg-mauve-100 text-mauve-700",
        error:   "bg-color-bg-error text-color-text-error",
    };
    return (
        <span className={`text-[10px] tn-bold px-1.5 py-0.5 rounded ${styles[status] ?? "bg-color-layer-3 text-color-text-alt"}`}>
            {status}
        </span>
    );
}

// ─── Notification row ────────────────────────────────────────────────────────

function NotificationConfigRow({
    config,
    onDelete,
    onUpdate,
}: {
    config: NotificationConfig;
    onDelete: () => void;
    onUpdate: (updated: Partial<NotificationConfig>) => void;
}) {
    // Determine current type from which field is set
    const initialType = config.slackWebhookUrl ? "slack" : "email";
    const [notifType, setNotifType] = useState(initialType);
    const [valueDraft, setValueDraft] = useState(
        notifType === "slack" ? (config.slackWebhookUrl ?? "") : config.emailRecipients.join(", ")
    );

    const save = async () => {
        try {
            const body = {
                scheduleId: config.scheduleId,
                emailRecipients: notifType === "email" ? valueDraft.split(",").map(s => s.trim()).filter(Boolean) : [],
                slackWebhookUrl: notifType === "slack" ? (valueDraft.trim() || null) : null,
            };
            const updated = await apiFetch(`/notification-config/id/${config.configId}/`, {
                method: "PUT",
                body: JSON.stringify(body),
            });
            onUpdate(updated);
        } catch { /* silent */ }
    };

    const handleTypeChange = (e: any) => {
        setNotifType(e.target.value);
        setValueDraft(""); // clear value when switching type
    };

    return (
        <div className="flex flex-col gap-2 p-3 rounded border border-color-border-alt bg-color-layer-2">
            <div className="flex gap-2 items-end">
                <div className="w-32 shrink-0">
                    <PktsInputRow label="Type">
                        <PktsInputSelect value={notifType} onChange={handleTypeChange}>
                            <PktsInputOption value="email">Email</PktsInputOption>
                            <PktsInputOption value="slack">Slack</PktsInputOption>
                        </PktsInputSelect>
                    </PktsInputRow>
                </div>
                <div className="flex-1">
                    <PktsInputRow label={notifType === "slack" ? "Webhook URL" : "Recipients"}>
                        <PktsInputText
                            placeholder={notifType === "slack"
                                ? "https://hooks.slack.com/services/…"
                                : "ops@example.com, noc@example.com"}
                            value={valueDraft}
                            onChange={(e: any) => setValueDraft(e.target.value)}
                            onBlur={save}
                        />
                    </PktsInputRow>
                </div>
                <PktsIconButton className="small-icon" variant="destructive" onClick={onDelete} title="Remove">
                    <Trash2 />
                </PktsIconButton>
            </div>
        </div>
    );
}

// ─── Schedule card ────────────────────────────────────────────────────────────

function ScheduleCard({
    schedule,
    datasets,
    onDelete,
    onToggle,
    onRunNow,
    onUpdate,
}: {
    schedule: CheckpointSchedule;
    datasets: Dataset[];
    onDelete: () => void;
    onToggle: () => void;
    onRunNow: () => void;
    onUpdate: (s: CheckpointSchedule) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [notifications, setNotifications] = useState<NotificationConfig[]>([]);
    const [loadingNotifs, setLoadingNotifs] = useState(false);
    const [running, setRunning] = useState(false);

    const [intervalPreset, setIntervalPreset] = useState(minutesToPreset(schedule.intervalMinutes));
    const [customMinutes, setCustomMinutes]   = useState(
        minutesToPreset(schedule.intervalMinutes) === "Other" ? String(schedule.intervalMinutes) : ""
    );
    const [keepLastN, setKeepLastN]       = useState(String(schedule.retention.keep_last_n ?? ""));
    const [keepEveryNth, setKeepEveryNth] = useState(String(schedule.retention.keep_every_nth ?? ""));

    const resolvedMinutes = (): number => {
        if (intervalPreset === "Other") return parseInt(customMinutes) || schedule.intervalMinutes;
        return INTERVAL_PRESETS.find(p => p.label === intervalPreset)?.minutes ?? schedule.intervalMinutes;
    };

    const fetchNotifs = useCallback(async () => {
        setLoadingNotifs(true);
        try {
            const data = await apiFetch(`/notification-configs/?scheduleId=${schedule.scheduleId}`);
            setNotifications(data);
        } finally {
            setLoadingNotifs(false);
        }
    }, [schedule.scheduleId]);

    useEffect(() => {
        if (expanded && notifications.length === 0) fetchNotifs();
    }, [expanded]);

    const saveSchedule = async () => {
        const body = {
            datasetId: schedule.datasetId,
            name: schedule.name,
            intervalMinutes: resolvedMinutes(),
            enabled: schedule.enabled,
            retention: {
                keep_last_n:    keepLastN    ? parseInt(keepLastN)    : null,
                keep_every_nth: keepEveryNth ? parseInt(keepEveryNth) : null,
            },
        };
        const updated = await apiFetch(`/checkpoint-schedule/id/${schedule.scheduleId}/`, {
            method: "PUT",
            body: JSON.stringify(body),
        });
        onUpdate(updated);
    };

    const handleRunNow = async () => {
        setRunning(true);
        try {
            await apiFetch(`/checkpoint-schedule/id/${schedule.scheduleId}/run/`, { method: "POST" });
            onRunNow();
        } finally {
            setRunning(false);
        }
    };

    const addNotification = async () => {
        const created = await apiFetch("/notification-config/", {
            method: "POST",
            body: JSON.stringify({ scheduleId: schedule.scheduleId, emailRecipients: [], slackWebhookUrl: null }),
        });
        setNotifications(prev => [...prev, created]);
    };

    const deleteNotification = async (configId: string) => {
        await apiFetch(`/notification-config/id/${configId}/`, { method: "DELETE" });
        setNotifications(prev => prev.filter(n => n.configId !== configId));
    };

    const datasetName = datasets.find(d => d.datasetId === schedule.datasetId)?.name ?? schedule.datasetId;

    return (
        <Card className="flex flex-col gap-0 overflow-hidden !p-0">
            {/* Header row */}
            <div className="flex items-center gap-3 px-4 py-3">
                <PktsInputSwitch
                    checked={schedule.enabled}
                    onChange={onToggle}
                    aria-label={schedule.enabled ? "Disable schedule" : "Enable schedule"}
                />

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm tn-bold text-color-text truncate">{schedule.name}</span>
                        <StatusPill status={schedule.lastRunStatus} />
                    </div>
                    <div className="text-xs text-color-text-alt mt-0.5 truncate tn-text">
                        {datasetName} · {formatInterval(schedule.intervalMinutes)}
                        {schedule.lastRunOn && ` · last run ${new Date(schedule.lastRunOn).toLocaleTimeString()}`}
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <PktsIconButton
                        className="small-icon"
                        variant="tertiary"
                        disabled={running}
                        onClick={handleRunNow}
                        title="Run now"
                    >
                        {running ? <Loader2 className="animate-spin" /> : <Play />}
                    </PktsIconButton>
                    <PktsIconButton
                        className="small-icon"
                        variant="destructive"
                        onClick={onDelete}
                        title="Delete"
                    >
                        <Trash2 />
                    </PktsIconButton>
                    <PktsIconButton
                        className="small-icon"
                        variant="tertiary"
                        onClick={() => setExpanded(e => !e)}
                    >
                        {expanded ? <ChevronUp /> : <ChevronDown />}
                    </PktsIconButton>
                </div>
            </div>

            {/* Expanded section */}
            {expanded && (
                <div className="border-t border-color-border-alt px-4 py-4 flex flex-col gap-4 bg-color-layer-2">

                    {/* Interval */}
                    <PktsInputRow label="Interval">
                        <PktsInputSelect
                            value={intervalPreset}
                            onChange={(e: any) => { setIntervalPreset(e.target.value); saveSchedule(); }}
                        >
                            {INTERVAL_PRESETS.map(p => (
                                <PktsInputOption key={p.label} value={p.label}>{p.label}</PktsInputOption>
                            ))}
                        </PktsInputSelect>
                    </PktsInputRow>
                    {intervalPreset === "Other" && (
                        <PktsInputRow label="Custom interval (minutes)">
                            <PktsInputText
                                type="number"
                                min="1"
                                value={customMinutes}
                                onChange={(e: any) => setCustomMinutes(e.target.value)}
                                onBlur={saveSchedule}
                            />
                        </PktsInputRow>
                    )}

                    {/* Retention */}
                    <div className="flex flex-col gap-2">
                        <span className="text-xs tn-bold text-color-text-alt uppercase tracking-wide">Retention</span>
                        <div className="grid grid-cols-2 gap-3">
                            <PktsInputRow label="Keep last N checkpoints">
                                <PktsInputText
                                    type="number"
                                    min="1"
                                    placeholder="∞ (keep all)"
                                    value={keepLastN}
                                    onChange={(e: any) => setKeepLastN(e.target.value)}
                                    onBlur={saveSchedule}
                                />
                            </PktsInputRow>
                            <PktsInputRow label="Keep every Nth">
                                <PktsInputText
                                    type="number"
                                    min="1"
                                    placeholder="none"
                                    value={keepEveryNth}
                                    onChange={(e: any) => setKeepEveryNth(e.target.value)}
                                    onBlur={saveSchedule}
                                />
                            </PktsInputRow>
                        </div>
                    </div>

                    {/* Error */}
                    {schedule.lastError && (
                        <div className="text-xs text-color-text-error bg-color-bg-error rounded px-3 py-2">
                            <span className="tn-bold">Last error: </span>{schedule.lastError}
                        </div>
                    )}

                    {/* Notifications */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                                <span className="text-xs tn-bold text-color-text-alt uppercase tracking-wide">Notifications</span>
                                <span className="relative group">
                                    <Info size={12} className="text-color-text-alt cursor-help" />
                                    <span className="pointer-events-none absolute left-5 top-0 z-50 w-64 rounded bg-esnetblack-800 text-esnetwhite-50 text-xs px-2.5 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 leading-snug">
                                        Notifications are sent when the scheduler detects a change between the current checkpoint and the last acknowledged checkpoint. Each notification targets either an email address list or a Slack webhook — add one per destination.
                                    </span>
                                </span>
                            </div>
                            <PktsButton variant="secondary" onClick={addNotification} className="w-fit">
                                <Plus size={12} className="mr-1" /> Add
                            </PktsButton>
                        </div>
                        {loadingNotifs && <PktsSpinner />}
                        {notifications.map(n => (
                            <NotificationConfigRow
                                key={n.configId}
                                config={n}
                                onDelete={() => deleteNotification(n.configId)}
                                onUpdate={updated =>
                                    setNotifications(prev => prev.map(x => x.configId === n.configId ? { ...x, ...updated } : x))
                                }
                            />
                        ))}
                        {!loadingNotifs && notifications.length === 0 && (
                            <p className="text-xs text-color-text-alt tn-text italic">No notifications configured.</p>
                        )}
                    </div>
                </div>
            )}
        </Card>
    );
}

// ─── New schedule form ────────────────────────────────────────────────────────

function NewScheduleForm({
    datasets,
    onCreated,
    onCancel,
}: {
    datasets: Dataset[];
    onCreated: (s: CheckpointSchedule) => void;
    onCancel: () => void;
}) {
    const [scheduleName, setScheduleName]     = useState("");
    const [datasetId, setDatasetId]           = useState("");
    const [intervalPreset, setIntervalPreset] = useState("Every 6 Hours");
    const [customMinutes, setCustomMinutes]   = useState("");
    const [notifType, setNotifType]   = useState("email");
    const [notifValue, setNotifValue] = useState("");
    const [retentionOpen, setRetentionOpen]     = useState(false);
    const [keepLastN, setKeepLastN]             = useState("50");
    const [keepEveryNth, setKeepEveryNth]       = useState("10");
    const [saving, setSaving]                   = useState(false);
    const [error, setError]                     = useState<string | null>(null);

    const resolvedMinutes = (): number => {
        if (intervalPreset === "Other") return parseInt(customMinutes) || 360;
        return INTERVAL_PRESETS.find(p => p.label === intervalPreset)?.minutes ?? 360;
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!datasetId) return;
        setSaving(true);
        setError(null);
        try {
            const body = {
                datasetId,
                name: scheduleName.trim() || `Checkpoint: ${datasets.find(d => d.datasetId === datasetId)?.name ?? datasetId}`,
                intervalMinutes: resolvedMinutes(),
                enabled: true,
                retention: {
                    keep_last_n:    keepLastN    ? parseInt(keepLastN)    : null,
                    keep_every_nth: keepEveryNth ? parseInt(keepEveryNth) : null,
                },
            };
            const created = await apiFetch("/checkpoint-schedule/", {
                method: "POST",
                body: JSON.stringify(body),
            });
            // Create notification config if a destination was provided
            if (notifValue.trim()) {
                await apiFetch("/notification-config/", {
                    method: "POST",
                    body: JSON.stringify({
                        scheduleId: created.scheduleId,
                        emailRecipients: notifType === "email"
                            ? notifValue.split(",").map(s => s.trim()).filter(Boolean)
                            : [],
                        slackWebhookUrl: notifType === "slack" ? notifValue.trim() : null,
                    }),
                });
            }
            onCreated(created);
        } catch (err: any) {
            setError(err?.message ?? "Failed to create schedule");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={submit} className="border border-color-border-alt rounded-lg p-4 bg-color-layer-2 flex flex-col gap-3">
            <div className="text-sm tn-bold text-color-text">New Checkpoint Schedule</div>

            <PktsInputRow label="Schedule Name">
                <PktsInputText
                    placeholder="e.g. Hourly topology check"
                    value={scheduleName}
                    onChange={(e: any) => setScheduleName(e.target.value)}
                />
            </PktsInputRow>

            <PktsInputRow label="Dataset">
                <PktsInputSelect
                    value={datasetId}
                    onChange={(e: any) => setDatasetId(e.target.value)}
                >
                    <PktsInputOption value="">— select a dataset —</PktsInputOption>
                    {datasets.map(d => (
                        <PktsInputOption key={d.datasetId} value={d.datasetId}>
                            {d.name}
                        </PktsInputOption>
                    ))}
                </PktsInputSelect>
            </PktsInputRow>

            <PktsInputRow label="Interval">
                <PktsInputSelect
                    value={intervalPreset}
                    onChange={(e: any) => setIntervalPreset(e.target.value)}
                >
                    {INTERVAL_PRESETS.map(p => (
                        <PktsInputOption key={p.label} value={p.label}>{p.label}</PktsInputOption>
                    ))}
                </PktsInputSelect>
            </PktsInputRow>
            {intervalPreset === "Other" && (
                <PktsInputRow label="Custom interval (minutes)">
                    <PktsInputText
                        type="number"
                        min="1"
                        placeholder="e.g. 120"
                        value={customMinutes}
                        onChange={(e: any) => setCustomMinutes(e.target.value)}
                    />
                </PktsInputRow>
            )}

            {/* Retention (twirldown) */}
            <div className="flex flex-col gap-2 pt-1 border-t border-color-border-alt">
                <button
                    type="button"
                    className="flex items-center gap-1 text-xs tn-bold text-color-text-alt uppercase tracking-wide w-fit"
                    onClick={() => setRetentionOpen(o => !o)}
                >
                    {retentionOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    Retention policy
                </button>
                {retentionOpen && (
                    <div className="grid grid-cols-2 gap-3">
                        <PktsInputRow label="Keep last N checkpoints">
                            <PktsInputText
                                type="number"
                                min="1"
                                placeholder="∞ (keep all)"
                                value={keepLastN}
                                onChange={(e: any) => setKeepLastN(e.target.value)}
                            />
                        </PktsInputRow>
                        <PktsInputRow label="Keep every Nth">
                            <PktsInputText
                                type="number"
                                min="1"
                                placeholder="none"
                                value={keepEveryNth}
                                onChange={(e: any) => setKeepEveryNth(e.target.value)}
                            />
                        </PktsInputRow>
                    </div>
                )}
            </div>

            {/* Optional notification */}
            <div className="flex flex-col gap-2 pt-1 border-t border-color-border-alt">
                <div className="flex items-center gap-1">
                    <span className="text-xs tn-bold text-color-text-alt uppercase tracking-wide">Notification (optional)</span>
                    <span className="relative group">
                        <Info size={12} className="text-color-text-alt cursor-help" />
                        <span className="pointer-events-none absolute left-5 top-0 z-50 w-64 rounded bg-esnetblack-800 text-esnetwhite-50 text-xs px-2.5 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 leading-snug">
                            Sent when the scheduler detects a change between the current checkpoint and the last acknowledged checkpoint. Choose Email or Slack. Add more notifications after saving.
                        </span>
                    </span>
                </div>
                <div className="flex gap-2 items-end">
                    <div className="w-32 shrink-0">
                        <PktsInputRow label="Type">
                            <PktsInputSelect value={notifType} onChange={(e: any) => { setNotifType(e.target.value); setNotifValue(""); }}>
                                <PktsInputOption value="email">Email</PktsInputOption>
                                <PktsInputOption value="slack">Slack</PktsInputOption>
                            </PktsInputSelect>
                        </PktsInputRow>
                    </div>
                    <div className="flex-1">
                        <PktsInputRow label={notifType === "slack" ? "Webhook URL" : "Recipients"}>
                            <PktsInputText
                                placeholder={notifType === "slack"
                                    ? "https://hooks.slack.com/services/…"
                                    : "ops@example.com, noc@example.com"}
                                value={notifValue}
                                onChange={(e: any) => setNotifValue(e.target.value)}
                            />
                        </PktsInputRow>
                    </div>
                </div>
            </div>

            {error && <p className="text-xs text-color-text-error">{error}</p>}

            <div className="flex gap-2 justify-end">
                <PktsButton type="button" variant="secondary" onClick={onCancel}>Cancel</PktsButton>
                <PktsButton type="submit" variant="primary" disabled={saving || !datasetId}>
                    {saving && <Loader2 size={12} className="animate-spin mr-1" />}
                    Create Schedule
                </PktsButton>
            </div>
        </form>
    );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function CheckpointSettings() {
    const [schedules, setSchedules]     = useState<CheckpointSchedule[]>([]);
    const [datasets, setDatasets]       = useState<Dataset[]>([]);
    const [loading, setLoading]         = useState(true);
    const [showNewForm, setShowNewForm] = useState(false);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [schedulesData, datasetsData] = await Promise.all([
                apiFetch("/checkpoint-schedules/"),
                apiFetch("/datasets/"),
            ]);
            setSchedules(schedulesData);
            setDatasets(datasetsData);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, []);

    const deleteSchedule = async (scheduleId: string) => {
        if (!confirm("Delete this checkpoint schedule?")) return;
        await apiFetch(`/checkpoint-schedule/id/${scheduleId}/`, { method: "DELETE" });
        setSchedules(prev => prev.filter(s => s.scheduleId !== scheduleId));
    };

    const toggleSchedule = async (schedule: CheckpointSchedule) => {
        const body = {
            datasetId: schedule.datasetId,
            name: schedule.name,
            intervalMinutes: schedule.intervalMinutes,
            enabled: !schedule.enabled,
            retention: schedule.retention,
        };
        const updated = await apiFetch(`/checkpoint-schedule/id/${schedule.scheduleId}/`, {
            method: "PUT",
            body: JSON.stringify(body),
        });
        setSchedules(prev => prev.map(s => s.scheduleId === schedule.scheduleId ? updated : s));
    };

    return (
        <div className="w-full">
            <Accordion header="Checkpoint Schedules">
                <div className="flex flex-col gap-3">
                    <p className="tn-text text-sm mb-2">
                        Checkpoint schedules automatically snapshot dataset query results on a recurring schedule.
                        When data changes are detected, configured notifications are dispatched.
                    </p>

                    {loading && (
                        <div className="flex items-center gap-2 py-4">
                            <PktsSpinner /> <span className="text-sm text-color-text-alt">Loading…</span>
                        </div>
                    )}

                    {!loading && schedules.length === 0 && !showNewForm && (
                        <p className="text-sm text-color-text-alt tn-text italic py-2">No checkpoint schedules configured.</p>
                    )}

                    {schedules.map(s => (
                        <ScheduleCard
                            key={s.scheduleId}
                            schedule={s}
                            datasets={datasets}
                            onDelete={() => deleteSchedule(s.scheduleId)}
                            onToggle={() => toggleSchedule(s)}
                            onRunNow={fetchAll}
                            onUpdate={updated =>
                                setSchedules(prev => prev.map(x => x.scheduleId === s.scheduleId ? updated : x))
                            }
                        />
                    ))}

                    {showNewForm && (
                        <NewScheduleForm
                            datasets={datasets}
                            onCreated={created => {
                                setSchedules(prev => [...prev, created]);
                                setShowNewForm(false);
                            }}
                            onCancel={() => setShowNewForm(false)}
                        />
                    )}

                    {!showNewForm && (
                        <button onClick={() => setShowNewForm(true)} className="cursor-pointer w-full">
                            <Card className="flex justify-center items-center gap-2 hover:shadow-md hover:text-dark-primary transition duration-300">
                                <Plus className="mb-0.5" />
                                Add Checkpoint Schedule
                            </Card>
                        </button>
                    )}
                </div>
            </Accordion>
        </div>
    );
}
