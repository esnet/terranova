import React, { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Play, Mail, Slack, ChevronDown, ChevronUp, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
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
    createdBy: string;
    createdOn: string;
}

// ─── API helpers ─────────────────────────────────────────────────────────────

function authHeaders(extra: Record<string, string> = {}) {
    return setAuthHeaders({ "Content-Type": "application/json", ...extra });
}

async function apiFetch(path: string, opts: RequestInit = {}) {
    const headers = authHeaders();
    const res = await fetch(`${API_URL}${path}`, { ...opts, headers });
    if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
    return res.json();
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string | null }) {
    if (!status) return null;
    const styles: Record<string, string> = {
        ok:      "bg-emerald-100 text-emerald-700",
        changed: "bg-violet-100 text-violet-700",
        error:   "bg-red-100 text-red-600",
    };
    return (
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${styles[status] ?? "bg-gray-100 text-gray-500"}`}>
            {status}
        </span>
    );
}

function NotificationConfigRow({
    config,
    onDelete,
    onUpdate,
}: {
    config: NotificationConfig;
    onDelete: () => void;
    onUpdate: (updated: Partial<NotificationConfig>) => void;
}) {
    const [emailDraft, setEmailDraft] = useState(config.emailRecipients.join(", "));
    const [slackDraft, setSlackDraft]  = useState(config.slackWebhookUrl ?? "");
    const [saving, setSaving] = useState(false);

    const save = async () => {
        setSaving(true);
        try {
            const body = {
                scheduleId: config.scheduleId,
                emailRecipients: emailDraft.split(",").map((s) => s.trim()).filter(Boolean),
                slackWebhookUrl: slackDraft || null,
            };
            const updated = await apiFetch(`/notification-config/id/${config.configId}/`, {
                method: "PUT",
                body: JSON.stringify(body),
            });
            onUpdate(updated);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="border border-gray-100 rounded-lg p-3 bg-gray-50 flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <Mail size={13} className="text-gray-400 shrink-0" />
                <input
                    className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                    placeholder="Email recipients (comma-separated)"
                    value={emailDraft}
                    onChange={(e) => setEmailDraft(e.target.value)}
                    onBlur={save}
                />
            </div>
            <div className="flex items-center gap-2">
                <Slack size={13} className="text-gray-400 shrink-0" />
                <input
                    className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                    placeholder="Slack webhook URL (optional)"
                    value={slackDraft}
                    onChange={(e) => setSlackDraft(e.target.value)}
                    onBlur={save}
                />
            </div>
            <div className="flex justify-end">
                <button
                    onClick={onDelete}
                    className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                >
                    <Trash2 size={11} /> Remove
                </button>
            </div>
        </div>
    );
}

function ScheduleCard({
    schedule,
    onDelete,
    onToggle,
    onRunNow,
    onUpdate,
}: {
    schedule: CheckpointSchedule;
    onDelete: () => void;
    onToggle: () => void;
    onRunNow: () => void;
    onUpdate: (s: CheckpointSchedule) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [notifications, setNotifications] = useState<NotificationConfig[]>([]);
    const [loadingNotifs, setLoadingNotifs] = useState(false);
    const [running, setRunning] = useState(false);

    const [intervalDraft, setIntervalDraft]     = useState(String(schedule.intervalMinutes));
    const [keepLastN, setKeepLastN]             = useState(String(schedule.retention.keep_last_n ?? ""));
    const [keepEveryNth, setKeepEveryNth]       = useState(String(schedule.retention.keep_every_nth ?? ""));

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
            intervalMinutes: parseInt(intervalDraft) || schedule.intervalMinutes,
            enabled: schedule.enabled,
            retention: {
                keep_last_n: keepLastN ? parseInt(keepLastN) : null,
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
        const body = {
            scheduleId: schedule.scheduleId,
            emailRecipients: [],
            slackWebhookUrl: null,
        };
        const created = await apiFetch("/notification-config/", {
            method: "POST",
            body: JSON.stringify(body),
        });
        setNotifications((prev) => [...prev, created]);
    };

    const deleteNotification = async (configId: string) => {
        await apiFetch(`/notification-config/id/${configId}/`, { method: "DELETE" });
        setNotifications((prev) => prev.filter((n) => n.configId !== configId));
    };

    return (
        <Card className="flex flex-col gap-0 overflow-hidden !p-0">
            {/* Card header row */}
            <div className="flex items-center gap-3 px-4 py-3">
                {/* Enable toggle */}
                <button onClick={onToggle} className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors">
                    {schedule.enabled
                        ? <ToggleRight size={20} className="text-emerald-500" />
                        : <ToggleLeft size={20} />
                    }
                </button>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-800 truncate">{schedule.name}</span>
                        <StatusPill status={schedule.lastRunStatus} />
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 truncate">
                        Dataset: <code className="font-mono">{schedule.datasetId}</code>
                        {" · "}
                        every {schedule.intervalMinutes}m
                        {schedule.lastRunOn && ` · last run ${new Date(schedule.lastRunOn).toLocaleTimeString()}`}
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        onClick={handleRunNow}
                        disabled={running}
                        title="Run checkpoint now"
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-50"
                    >
                        {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                    </button>
                    <button
                        onClick={onDelete}
                        title="Delete schedule"
                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                    <button
                        onClick={() => setExpanded((e) => !e)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 transition-colors"
                    >
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                </div>
            </div>

            {/* Expanded settings */}
            {expanded && (
                <div className="border-t border-gray-100 px-4 py-3 flex flex-col gap-4 bg-gray-50">
                    {/* Interval + retention */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                                Interval (min)
                            </label>
                            <input
                                type="number"
                                min={1}
                                className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                                value={intervalDraft}
                                onChange={(e) => setIntervalDraft(e.target.value)}
                                onBlur={saveSchedule}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                                Keep last N
                            </label>
                            <input
                                type="number"
                                min={1}
                                className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                                placeholder="∞"
                                value={keepLastN}
                                onChange={(e) => setKeepLastN(e.target.value)}
                                onBlur={saveSchedule}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                                Keep every Nth
                            </label>
                            <input
                                type="number"
                                min={1}
                                className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                                placeholder="none"
                                value={keepEveryNth}
                                onChange={(e) => setKeepEveryNth(e.target.value)}
                                onBlur={saveSchedule}
                            />
                        </div>
                    </div>

                    {schedule.lastError && (
                        <div className="text-xs text-red-600 bg-red-50 rounded px-3 py-2 border border-red-100">
                            <span className="font-semibold">Last error: </span>{schedule.lastError}
                        </div>
                    )}

                    {/* Notification configs */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                                Notifications
                            </span>
                            <button
                                onClick={addNotification}
                                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors"
                            >
                                <Plus size={11} /> Add
                            </button>
                        </div>

                        {loadingNotifs && (
                            <div className="text-xs text-gray-400">Loading…</div>
                        )}

                        {notifications.map((n) => (
                            <NotificationConfigRow
                                key={n.configId}
                                config={n}
                                onDelete={() => deleteNotification(n.configId)}
                                onUpdate={(updated) =>
                                    setNotifications((prev) =>
                                        prev.map((x) => (x.configId === n.configId ? { ...x, ...updated } : x)),
                                    )
                                }
                            />
                        ))}

                        {!loadingNotifs && notifications.length === 0 && (
                            <p className="text-xs text-gray-400 italic">No notifications configured.</p>
                        )}
                    </div>
                </div>
            )}
        </Card>
    );
}

// ─── New schedule form ────────────────────────────────────────────────────────

interface NewScheduleFormProps {
    onCreated: (s: CheckpointSchedule) => void;
    onCancel: () => void;
}

function NewScheduleForm({ onCreated, onCancel }: NewScheduleFormProps) {
    const [datasetId, setDatasetId]           = useState("");
    const [name, setName]                     = useState("");
    const [intervalMinutes, setIntervalMinutes] = useState("360");
    const [saving, setSaving]                 = useState(false);
    const [error, setError]                   = useState<string | null>(null);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const body = {
                datasetId: datasetId.trim(),
                name: name.trim() || `Checkpoint: ${datasetId.trim()}`,
                intervalMinutes: parseInt(intervalMinutes) || 360,
                enabled: true,
                retention: { keep_last_n: 50, keep_every_nth: 10 },
            };
            const created = await apiFetch("/checkpoint-schedule/", {
                method: "POST",
                body: JSON.stringify(body),
            });
            onCreated(created);
        } catch (err: any) {
            setError(err?.message ?? "Failed to create schedule");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={submit} className="border border-blue-200 rounded-lg p-4 bg-blue-50 flex flex-col gap-3">
            <div className="text-sm font-semibold text-gray-700">New Checkpoint Schedule</div>
            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 col-span-2">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Dataset ID</label>
                    <input
                        required
                        className="text-xs border border-gray-200 rounded px-2 py-1.5 bg-white font-mono"
                        placeholder="e.g. aBc1234"
                        value={datasetId}
                        onChange={(e) => setDatasetId(e.target.value)}
                    />
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Name</label>
                    <input
                        className="text-xs border border-gray-200 rounded px-2 py-1.5 bg-white"
                        placeholder="e.g. Hourly topology check"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Interval (min)</label>
                    <input
                        type="number"
                        min={1}
                        className="text-xs border border-gray-200 rounded px-2 py-1.5 bg-white"
                        value={intervalMinutes}
                        onChange={(e) => setIntervalMinutes(e.target.value)}
                    />
                </div>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-2 justify-end">
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded border border-gray-200 bg-white transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={saving || !datasetId.trim()}
                    className="text-xs text-white bg-blue-500 hover:bg-blue-600 px-3 py-1.5 rounded transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                    {saving && <Loader2 size={11} className="animate-spin" />}
                    Create
                </button>
            </div>
        </form>
    );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function CheckpointSettings() {
    const [schedules, setSchedules]       = useState<CheckpointSchedule[]>([]);
    const [loading, setLoading]           = useState(true);
    const [showNewForm, setShowNewForm]   = useState(false);

    const fetchSchedules = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiFetch("/checkpoint-schedules/");
            setSchedules(data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchSchedules(); }, []);

    const deleteSchedule = async (scheduleId: string) => {
        if (!confirm("Delete this checkpoint schedule?")) return;
        await apiFetch(`/checkpoint-schedule/id/${scheduleId}/`, { method: "DELETE" });
        setSchedules((prev) => prev.filter((s) => s.scheduleId !== scheduleId));
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
        setSchedules((prev) =>
            prev.map((s) => (s.scheduleId === schedule.scheduleId ? updated : s)),
        );
    };

    return (
        <div className="w-full">
            <Accordion header="Checkpoint Schedules">
                <div className="flex flex-col gap-3">
                    <p className="tn-text text-sm mb-2">
                        Checkpoint schedules automatically snapshot dataset query results on a schedule.
                        When topology changes are detected, connected notifications are dispatched.
                    </p>

                    {loading && (
                        <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                            <Loader2 size={14} className="animate-spin" /> Loading schedules…
                        </div>
                    )}

                    {!loading && schedules.length === 0 && !showNewForm && (
                        <p className="text-sm text-gray-400 italic py-2">No checkpoint schedules configured.</p>
                    )}

                    {schedules.map((s) => (
                        <ScheduleCard
                            key={s.scheduleId}
                            schedule={s}
                            onDelete={() => deleteSchedule(s.scheduleId)}
                            onToggle={() => toggleSchedule(s)}
                            onRunNow={fetchSchedules}
                            onUpdate={(updated) =>
                                setSchedules((prev) =>
                                    prev.map((x) => (x.scheduleId === s.scheduleId ? updated : x)),
                                )
                            }
                        />
                    ))}

                    {showNewForm && (
                        <NewScheduleForm
                            onCreated={(created) => {
                                setSchedules((prev) => [...prev, created]);
                                setShowNewForm(false);
                            }}
                            onCancel={() => setShowNewForm(false)}
                        />
                    )}

                    {!showNewForm && (
                        <button
                            onClick={() => setShowNewForm(true)}
                            className="cursor-pointer w-full"
                        >
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
