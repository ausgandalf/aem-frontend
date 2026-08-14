'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';
import { ProcessInspection } from './types';

const STATUS_OPTIONS = ['pending', 'approved', 'rejected'];

interface Props {
    inspection: ProcessInspection;
    onClose: () => void;
    onSaved: () => void;
}

export default function StatusChangerDrawer({ inspection, onClose, onSaved }: Props) {
    const [status, setStatus] = useState(inspection.status ?? 'pending');
    const [note, setNote] = useState(inspection.note ?? '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [visible, setVisible] = useState(false);

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

    const save = async () => {
        setSaving(true);
        setError('');
        const res = await api(`/api/inspections/${inspection.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status, note }),
        });
        if (res.ok) {
            onSaved();
            handleClose();
        } else {
            const data = await res.json();
            setError(data.message ?? 'Could not save.');
            setSaving(false);
        }
    };

    return createPortal(
        <>
            <div
                className={`fixed inset-0 z-[70] bg-black/40 transition-opacity duration-300 ${
                    visible ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={handleClose}
            />
            <div
                className={`fixed right-0 top-0 z-[71] flex h-full w-full flex-col border-l border-border-token bg-surface shadow-xl transition-transform duration-300 ease-out sm:w-[440px] ${
                    visible ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex items-center justify-between border-b border-border-token p-4">
                    <h2 className="text-lg font-bold text-text-primary">Change status</h2>
                    <button
                        onClick={handleClose}
                        className="cursor-pointer text-xl text-text-muted hover:text-text-primary"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <p className="mb-4 text-sm text-text-muted">
                        {inspection.sector_label ?? inspection.sector_key}
                    </p>

                    {error && (
                        <div className="mb-4 rounded bg-danger-bg p-2 text-sm text-danger-text">{error}</div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                            >
                                {STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary">Note</label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows={5}
                                placeholder="Optional note for this item…"
                                className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="border-t border-border-token p-4">
                    <button
                        onClick={save}
                        disabled={saving}
                        className="w-full cursor-pointer rounded bg-primary py-2 font-medium text-primary-text hover:bg-primary-hover disabled:opacity-50"
                    >
                        {saving ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </div>
        </>,
        document.body,
    );
}
