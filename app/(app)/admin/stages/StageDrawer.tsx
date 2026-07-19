'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useDragSort } from '@/lib/useDragSort';
import Spinner from '@/components/Spinner';
import { GripIcon, PencilIcon, TrashIcon } from '@/components/SVGs';
import { Sector, Stage, RoleOption } from './types';

interface Props {
    stage: Stage | null; // null = create mode
    onClose: () => void;
    onChanged: () => void;
}

interface StageForm {
    key: string;
    label: string;
    role: string;
    status: string;
}

const STATUS_OPTIONS = ['on', 'off'];

export default function StageDrawer({ stage, onClose, onChanged }: Props) {
    // The persisted stage: starts from the prop (edit) or null (create). Once a
    // brand-new stage is saved, we keep this set so the sector editor unlocks.
    const [saved, setSaved] = useState<Stage | null>(stage);
    const isCreate = saved === null;

    const [form, setForm] = useState<StageForm>({
        key: stage?.key ?? '',
        label: stage?.label ?? '',
        role: stage?.role ?? '',
        status: stage?.status ?? 'on',
    });
    const [original, setOriginal] = useState<StageForm>(form);

    const [roles, setRoles] = useState<RoleOption[]>([]);
    const [sectors, setSectors] = useState<Sector[]>(stage?.sectors ?? []);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [visible, setVisible] = useState(false);

    // Keep a live mirror so the drag "onDrop" persist reads the latest order.
    const sectorsRef = useRef(sectors);
    useEffect(() => {
        sectorsRef.current = sectors;
    }, [sectors]);

    useEffect(() => {
        const frame = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    const handleClose = useCallback(() => {
        setVisible(false);
        setTimeout(onClose, 300);
    }, [onClose]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [handleClose]);

    useEffect(() => {
        api('/api/roles')
            .then((r) => (r.ok ? r.json() : []))
            .then(setRoles)
            .catch(() => setRoles([]));
    }, []);

    const set = (k: keyof StageForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

    const isDirty = (Object.keys(form) as (keyof StageForm)[]).some(
        (k) => form[k] !== original[k],
    );

    const saveStage = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMsg(null);

        // key is immutable after creation — omit it from the update payload.
        const payload = isCreate
            ? form
            : { label: form.label, role: form.role, status: form.status };

        const res = await api(
            isCreate ? '/api/admin/stages' : `/api/admin/stages/${saved!.id}`,
            { method: isCreate ? 'POST' : 'PATCH', body: JSON.stringify(payload) },
        );
        const data = await res.json();

        if (res.ok) {
            setSaved(data);
            setSectors(data.sectors ?? []);
            setOriginal({ ...form });
            setMsg({ type: 'success', text: isCreate ? 'Stage created — you can now add sectors' : 'Saved' });
            onChanged();
        } else {
            const first = data.errors
                ? (Object.values(data.errors)[0] as string[])[0]
                : data.message;
            setMsg({ type: 'error', text: first ?? 'Save failed' });
        }
        setSaving(false);
    };

    // ── Sector persistence helpers ──────────────────────────────────────────
    const persistSectorOrder = async () => {
        if (!saved) return;
        await api(`/api/admin/stages/${saved.id}/sectors/reorder`, {
            method: 'POST',
            body: JSON.stringify({ ids: sectorsRef.current.map((s) => s.id) }),
        });
        onChanged();
    };

    const { draggingId, dragProps } = useDragSort<Sector>(
        sectors,
        (s) => s.id,
        setSectors,
        persistSectorOrder,
    );

    const addSector = async (payload: { key: string; label: string; description: string }) => {
        if (!saved) return { ok: false, error: 'Save the stage first' };
        const res = await api(`/api/admin/stages/${saved.id}/sectors`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok) {
            setSectors((prev) => [...prev, data]);
            onChanged();
            return { ok: true };
        }
        const first = data.errors
            ? (Object.values(data.errors)[0] as string[])[0]
            : data.message;
        return { ok: false, error: first ?? 'Failed to add sector' };
    };

    const saveSector = async (
        id: number,
        payload: { key: string; label: string; description: string },
    ) => {
        const res = await api(`/api/admin/sectors/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok) {
            setSectors((prev) => prev.map((s) => (s.id === id ? data : s)));
            onChanged();
            return { ok: true };
        }
        const first = data.errors
            ? (Object.values(data.errors)[0] as string[])[0]
            : data.message;
        return { ok: false, error: first ?? 'Failed to save sector' };
    };

    const deleteSector = async (id: number) => {
        if (!confirm('Remove this sector?')) return;
        const res = await api(`/api/admin/sectors/${id}`, { method: 'DELETE' });
        if (res.ok) {
            setSectors((prev) => prev.filter((s) => s.id !== id));
            onChanged();
        }
    };

    return (
        <>
            <div
                className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
                    visible ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={handleClose}
            />

            <div
                className={`fixed right-0 top-0 z-50 flex h-full w-full flex-col border-l border-border-token bg-surface shadow-xl transition-transform duration-300 ease-out sm:w-[560px] ${
                    visible ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex items-center justify-between border-b border-border-token p-4">
                    <h2 className="text-lg font-bold text-text-primary">
                        {isCreate ? 'New Stage' : form.label || 'Stage'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="cursor-pointer text-xl text-text-muted hover:text-text-primary"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {msg && (
                        <div
                            className={`mb-4 rounded p-3 text-sm ${
                                msg.type === 'success'
                                    ? 'bg-success-bg text-success-text'
                                    : 'bg-danger-bg text-danger-text'
                            }`}
                        >
                            {msg.text}
                        </div>
                    )}

                    {/* ── Stage form ── */}
                    <form onSubmit={saveStage} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary">
                                Key {isCreate && <span className="text-danger">*</span>}
                            </label>
                            <input
                                value={form.key}
                                onChange={(e) => set('key', e.target.value)}
                                disabled={!isCreate}
                                required={isCreate}
                                placeholder="e.g. legal_review"
                                className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none disabled:opacity-60"
                            />
                            <p className="mt-1 text-xs text-text-muted">
                                {isCreate
                                    ? 'Letters, numbers, dashes and underscores. Cannot be changed later.'
                                    : 'The key is locked — it is referenced by existing applications and documents.'}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary">
                                Label <span className="text-danger">*</span>
                            </label>
                            <input
                                value={form.label}
                                onChange={(e) => set('label', e.target.value)}
                                required
                                className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary">
                                Role <span className="text-danger">*</span>
                            </label>
                            <select
                                value={form.role}
                                onChange={(e) => set('role', e.target.value)}
                                required
                                className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                            >
                                <option value="">Select a role…</option>
                                {roles.map((r) => (
                                    <option key={r.name} value={r.name}>
                                        {r.label} ({r.name})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary">
                                Status
                            </label>
                            <select
                                value={form.status}
                                onChange={(e) => set('status', e.target.value)}
                                className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                            >
                                {STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={saving || (!isCreate && !isDirty)}
                            className="w-full cursor-pointer rounded bg-primary py-2 font-medium text-primary-text hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving ? 'Saving…' : isCreate ? 'Create stage' : 'Save changes'}
                        </button>
                    </form>

                    {/* ── Sectors ── */}
                    <div className="mt-8">
                        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-text-muted">
                            Sectors
                        </h3>

                        {isCreate ? (
                            <p className="rounded border border-dashed border-border-token p-4 text-sm text-text-muted">
                                Create the stage first, then add its sectors here.
                            </p>
                        ) : (
                            <>
                                <p className="mb-3 text-xs text-text-muted">
                                    Drag to reorder — the new order saves automatically.
                                </p>

                                <div className="space-y-2">
                                    {sectors.map((sec) => (
                                        <SectorRow
                                            key={sec.id}
                                            sector={sec}
                                            dragging={draggingId === sec.id}
                                            dragProps={dragProps(sec.id)}
                                            onSave={(p) => saveSector(sec.id, p)}
                                            onDelete={() => deleteSector(sec.id)}
                                        />
                                    ))}
                                    {sectors.length === 0 && (
                                        <p className="text-sm text-text-muted">No sectors yet.</p>
                                    )}
                                </div>

                                <AddSectorForm onAdd={addSector} />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

// ── Sector row: read view with inline edit toggle ───────────────────────────
function SectorRow({
    sector,
    dragging,
    dragProps,
    onSave,
    onDelete,
}: {
    sector: Sector;
    dragging: boolean;
    dragProps: Record<string, unknown>;
    onSave: (p: { key: string; label: string; description: string }) => Promise<{ ok: boolean; error?: string }>;
    onDelete: () => void;
}) {
    const [editing, setEditing] = useState(false);
    const [key, setKey] = useState(sector.key);
    const [label, setLabel] = useState(sector.label);
    const [description, setDescription] = useState(sector.description ?? '');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const startEdit = () => {
        setKey(sector.key);
        setLabel(sector.label);
        setDescription(sector.description ?? '');
        setError(null);
        setEditing(true);
    };

    const save = async () => {
        setBusy(true);
        setError(null);
        const res = await onSave({ key, label, description });
        setBusy(false);
        if (res.ok) setEditing(false);
        else setError(res.error ?? 'Failed');
    };

    if (editing) {
        return (
            <div className="rounded-lg border border-primary bg-surface p-3">
                {error && <p className="mb-2 text-xs text-danger-text">{error}</p>}
                <div className="space-y-2">
                    <input
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="Label"
                        className="w-full rounded border border-border-token bg-surface px-2 py-1.5 text-sm text-text-primary focus:border-primary focus:outline-none"
                    />
                    <input
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        placeholder="Key (unique)"
                        className="w-full rounded border border-border-token bg-surface px-2 py-1.5 font-mono text-xs text-text-primary focus:border-primary focus:outline-none"
                    />
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description (optional)"
                        rows={2}
                        className="w-full rounded border border-border-token bg-surface px-2 py-1.5 text-sm text-text-primary focus:border-primary focus:outline-none"
                    />
                </div>
                <div className="mt-2 flex gap-2">
                    <button
                        onClick={save}
                        disabled={busy || !label.trim() || !key.trim()}
                        className="cursor-pointer rounded bg-primary px-3 py-1 text-xs font-medium text-primary-text hover:bg-primary-hover disabled:opacity-50"
                    >
                        {busy ? 'Saving…' : 'Save'}
                    </button>
                    <button
                        onClick={() => setEditing(false)}
                        className="cursor-pointer rounded border border-border-token px-3 py-1 text-xs text-text-secondary hover:bg-surface-hover"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            {...dragProps}
            className={`flex items-center gap-2 rounded-lg border border-border-token bg-surface p-2.5 ${
                dragging ? 'opacity-50 shadow-lg' : ''
            }`}
        >
            <span className="cursor-grab text-text-muted active:cursor-grabbing" title="Drag to reorder">
                <GripIcon size={16} />
            </span>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-text-primary">
                        {sector.label}
                    </span>
                    <span className="font-mono text-xs text-text-muted">{sector.key}</span>
                </div>
                {sector.description && (
                    <p className="truncate text-xs text-text-muted">{sector.description}</p>
                )}
            </div>
            <button
                onClick={startEdit}
                title="Edit sector"
                className="rounded border border-text-secondary p-1.5 text-text-secondary hover:border-primary hover:text-primary"
            >
                <PencilIcon size={14} />
            </button>
            <button
                onClick={onDelete}
                title="Remove sector"
                className="rounded border border-text-secondary p-1.5 text-text-secondary hover:border-danger hover:text-danger"
            >
                <TrashIcon size={14} />
            </button>
        </div>
    );
}

// ── Add sector form ─────────────────────────────────────────────────────────
function AddSectorForm({
    onAdd,
}: {
    onAdd: (p: { key: string; label: string; description: string }) => Promise<{ ok: boolean; error?: string }>;
}) {
    const [open, setOpen] = useState(false);
    const [key, setKey] = useState('');
    const [label, setLabel] = useState('');
    const [description, setDescription] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reset = () => {
        setKey('');
        setLabel('');
        setDescription('');
        setError(null);
    };

    const submit = async () => {
        setBusy(true);
        setError(null);
        const res = await onAdd({ key, label, description });
        setBusy(false);
        if (res.ok) {
            reset();
            setOpen(false);
        } else {
            setError(res.error ?? 'Failed');
        }
    };

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="mt-3 w-full cursor-pointer rounded border border-dashed border-border-token py-2 text-sm font-medium text-text-secondary hover:border-primary hover:text-primary"
            >
                + Add sector
            </button>
        );
    }

    return (
        <div className="mt-3 rounded-lg border border-primary bg-surface p-3">
            {error && <p className="mb-2 text-xs text-danger-text">{error}</p>}
            <div className="space-y-2">
                <input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Label"
                    className="w-full rounded border border-border-token bg-surface px-2 py-1.5 text-sm text-text-primary focus:border-primary focus:outline-none"
                />
                <input
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="Key (unique, e.g. water_sanitation)"
                    className="w-full rounded border border-border-token bg-surface px-2 py-1.5 font-mono text-xs text-text-primary focus:border-primary focus:outline-none"
                />
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description (optional)"
                    rows={2}
                    className="w-full rounded border border-border-token bg-surface px-2 py-1.5 text-sm text-text-primary focus:border-primary focus:outline-none"
                />
            </div>
            <div className="mt-2 flex gap-2">
                <button
                    onClick={submit}
                    disabled={busy || !label.trim() || !key.trim()}
                    className="cursor-pointer rounded bg-primary px-3 py-1 text-xs font-medium text-primary-text hover:bg-primary-hover disabled:opacity-50"
                >
                    {busy ? 'Adding…' : 'Add sector'}
                </button>
                <button
                    onClick={() => {
                        reset();
                        setOpen(false);
                    }}
                    className="cursor-pointer rounded border border-border-token px-3 py-1 text-xs text-text-secondary hover:bg-surface-hover"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
