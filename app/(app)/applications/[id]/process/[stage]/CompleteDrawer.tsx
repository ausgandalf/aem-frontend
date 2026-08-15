'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';
import { useStages } from '@/lib/useStages';
import { useDragSort } from '@/lib/useDragSort';
import { GripIcon, TrashIcon, PlusIcon } from '@/components/SVGs';

interface AddlItem {
    id: number;
    label: string;
    description: string;
}

interface Props {
    applicationId: number;
    stageKey: string;
    stageLabel: string;
    onClose: () => void;
    onDone: () => void;
}

let localId = 1;

export default function CompleteDrawer({
    applicationId,
    stageKey,
    stageLabel,
    onClose,
    onDone,
}: Props) {
    const { stages } = useStages();

    const priorStages = useMemo(() => {
        const current = stages.find((s) => s.key === stageKey);
        if (!current) return [];
        return stages.filter((s) => s.order < current.order).sort((a, b) => a.order - b.order);
    }, [stages, stageKey]);

    const nextStage = useMemo(() => {
        const current = stages.find((s) => s.key === stageKey);
        if (!current) return null;
        return stages.filter((s) => s.order > current.order).sort((a, b) => a.order - b.order)[0] ?? null;
    }, [stages, stageKey]);

    const [decision, setDecision] = useState<'pass' | 'reject'>('pass');
    const [targetStage, setTargetStage] = useState('');
    const [note, setNote] = useState('');
    const [items, setItems] = useState<AddlItem[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [visible, setVisible] = useState(false);

    // Default the reject target to the immediately previous stage.
    useEffect(() => {
        if (priorStages.length && !targetStage) {
            setTargetStage(priorStages[priorStages.length - 1].key);
        }
    }, [priorStages, targetStage]);

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

    const { draggingId, dragProps } = useDragSort<AddlItem>(items, (i) => i.id, setItems);

    const setItem = (id: number, patch: Partial<AddlItem>) =>
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
    const addItem = () =>
        setItems((prev) => [...prev, { id: localId++, label: '', description: '' }]);
    const removeItem = (id: number) => setItems((prev) => prev.filter((it) => it.id !== id));

    // Where the additional inquiries will land.
    const targetLabel =
        decision === 'pass'
            ? nextStage?.label ?? '(final stage — none)'
            : priorStages.find((s) => s.key === targetStage)?.label ?? '—';

    const submit = async () => {
        setSaving(true);
        setError('');
        const payload = {
            decision,
            note,
            ...(decision === 'reject' ? { target_stage: targetStage } : {}),
            inspections: items
                .filter((i) => i.label.trim())
                .map((i) => ({ label: i.label.trim(), description: i.description.trim() })),
        };
        const res = await api(`/api/applications/${applicationId}/process/${stageKey}/complete`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        if (res.ok) {
            onDone();
        } else {
            const data = await res.json().catch(() => ({}));
            const first = data.errors ? (Object.values(data.errors)[0] as string[])[0] : data.message;
            setError(first ?? 'Could not record the decision.');
            setSaving(false);
        }
    };

    const canSubmit = decision === 'pass' || (decision === 'reject' && targetStage);

    return createPortal(
        <>
            <div
                className={`fixed inset-0 z-[70] bg-black/40 transition-opacity duration-300 ${
                    visible ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={handleClose}
            />
            <div
                className={`fixed right-0 top-0 z-[71] flex h-full w-full flex-col border-l border-border-token bg-surface shadow-xl transition-transform duration-300 ease-out sm:w-[520px] ${
                    visible ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex items-center justify-between border-b border-border-token p-4">
                    <h2 className="text-lg font-bold text-text-primary">Complete: {stageLabel}</h2>
                    <button
                        onClick={handleClose}
                        className="cursor-pointer text-xl text-text-muted hover:text-text-primary"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {error && (
                        <div className="mb-4 rounded bg-danger-bg p-2 text-sm text-danger-text">{error}</div>
                    )}

                    {/* Decision */}
                    <div className="space-y-2">
                        <span className="block text-sm font-medium text-text-secondary">Decision</span>
                        <div className="flex gap-3">
                            {(['pass', 'reject'] as const).map((d) => (
                                <label
                                    key={d}
                                    className={`flex flex-1 cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium capitalize transition ${
                                        decision === d
                                            ? d === 'pass'
                                                ? 'border-success bg-success-bg text-success-text'
                                                : 'border-danger bg-danger-bg text-danger-text'
                                            : 'border-border-token text-text-secondary hover:bg-surface-hover'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="decision"
                                        value={d}
                                        checked={decision === d}
                                        onChange={() => setDecision(d)}
                                        className="accent-primary"
                                    />
                                    {d}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Reject target */}
                    {decision === 'reject' && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-text-secondary">
                                Send back to
                            </label>
                            {priorStages.length === 0 ? (
                                <p className="mt-1 text-sm text-text-muted">No earlier stage available.</p>
                            ) : (
                                <select
                                    value={targetStage}
                                    onChange={(e) => setTargetStage(e.target.value)}
                                    className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                                >
                                    {priorStages.map((s) => (
                                        <option key={s.key} value={s.key}>
                                            {s.label}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}

                    {/* Note */}
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-text-secondary">Note</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={4}
                            placeholder="Explain the decision (recorded on the timeline)…"
                            className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
                        />
                    </div>

                    {/* Additional inspections */}
                    <div className="mt-6">
                        <h3 className="text-sm font-semibold text-text-primary">
                            Additional Inspections to Request
                        </h3>
                        <p className="mt-0.5 mb-3 text-xs text-text-muted">
                            Extra inquiries to add at <span className="font-medium">{targetLabel}</span>. Drag to
                            reorder.
                        </p>

                        <div className="space-y-2">
                            {items.map((it) => (
                                <div
                                    key={it.id}
                                    {...dragProps(it.id)}
                                    className={`rounded-lg border border-border-token bg-surface p-2.5 ${
                                        draggingId === it.id ? 'opacity-50 shadow-lg' : ''
                                    }`}
                                >
                                    <div className="flex items-start gap-2">
                                        <span
                                            className="mt-1.5 cursor-grab text-text-muted active:cursor-grabbing"
                                            title="Drag to reorder"
                                        >
                                            <GripIcon size={16} />
                                        </span>
                                        <div className="min-w-0 flex-1 space-y-2">
                                            <input
                                                value={it.label}
                                                onChange={(e) => setItem(it.id, { label: e.target.value })}
                                                placeholder="Inspection label (required)"
                                                className="w-full rounded border border-border-token bg-surface px-2 py-1.5 text-sm text-text-primary focus:border-primary focus:outline-none"
                                            />
                                            <input
                                                value={it.description}
                                                onChange={(e) => setItem(it.id, { description: e.target.value })}
                                                placeholder="Description (optional)"
                                                className="w-full rounded border border-border-token bg-surface px-2 py-1.5 text-sm text-text-primary focus:border-primary focus:outline-none"
                                            />
                                        </div>
                                        <button
                                            onClick={() => removeItem(it.id)}
                                            title="Remove"
                                            className="mt-1 rounded border border-text-secondary p-1.5 text-text-secondary hover:border-danger hover:text-danger"
                                        >
                                            <TrashIcon size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={addItem}
                            className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1 rounded border border-dashed border-border-token py-2 text-sm font-medium text-text-secondary hover:border-primary hover:text-primary"
                        >
                            <PlusIcon size={16} /> Add inspection
                        </button>
                    </div>
                </div>

                <div className="border-t border-border-token p-4">
                    <button
                        onClick={submit}
                        disabled={saving || !canSubmit}
                        className="w-full cursor-pointer rounded bg-primary py-2 font-medium text-primary-text hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {saving
                            ? 'Submitting…'
                            : decision === 'pass'
                              ? `Pass → ${nextStage?.label ?? 'complete'}`
                              : `Reject → ${targetLabel}`}
                    </button>
                </div>
            </div>
        </>,
        document.body,
    );
}
