'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';
import { useStages } from '@/lib/useStages';

export const FLAG_OPTIONS = ['ok', 'warning', 'invalid', 'ignore'] as const;

interface DocLike {
    id: number;
    description: string | null;
    flag: string;
    flag_note: string | null;
    stage_key?: string | null;
    sector_key?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    submitted_by?: string | null;
    updated_by?: string | null;
    file: {
        original_name: string;
        about: string | null;
        tags: string | null;
    };
}

interface Props {
    applicationId: number;
    doc: DocLike;
    onClose: () => void;
    onSaved: () => void;
    readOnly?: boolean; // info-only view (summary drawer): no editing, no save
}

const fmtDate = (v?: string | null) =>
    v ? new Date(v).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export default function DocumentDetailsModal({
    applicationId,
    doc,
    onClose,
    onSaved,
    readOnly = false,
}: Props) {
    const { getLabel } = useStages();

    const initial = {
        description: doc.description ?? '',
        flag: doc.flag ?? 'ok',
        flag_note: doc.flag_note ?? '',
    };
    const [description, setDescription] = useState(initial.description);
    const [flag, setFlag] = useState(initial.flag);
    const [flagNote, setFlagNote] = useState(initial.flag_note);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const isDirty =
        description !== initial.description ||
        flag !== initial.flag ||
        flagNote !== initial.flag_note;

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            e.stopPropagation(); // don't let the drawer behind us also close
            onClose();
        };
        window.addEventListener('keydown', onKey, true);
        return () => window.removeEventListener('keydown', onKey, true);
    }, [onClose]);

    const handleSave = async () => {
        setSaving(true);
        setError('');

        const res = await api(`/api/applications/${applicationId}/documents/${doc.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ description, flag, flag_note: flagNote }),
        });
        const body = await res.json();

        if (res.ok) {
            onSaved();
            onClose();
        } else {
            const firstError = body.errors
                ? (Object.values(body.errors)[0] as string[])[0]
                : body.message;
            setError(firstError ?? 'Could not save.');
            setSaving(false);
        }
    };

    const metaRows: [string, string][] = [
        ['Uploaded by', doc.submitted_by ?? '—'],
        ['Updated by', doc.updated_by ?? '—'],
        ['Uploaded', fmtDate(doc.created_at)],
        ['Updated', fmtDate(doc.updated_at)],
        ['Stage', doc.stage_key ? getLabel(doc.stage_key) : '—'],
        ['Inspection / sector', doc.sector_key || '—'],
    ];

    const flagBadge = (
        <span
            className={`rounded px-2 py-0.5 text-xs font-medium ${
                {
                    ok: 'bg-success-bg text-success-text',
                    warning: 'bg-warning-bg text-warning-text',
                    invalid: 'bg-danger-bg text-danger-text',
                    ignore: 'bg-surface-dark text-text-muted',
                }[flag] ?? 'bg-surface-hover text-text-muted'
            }`}
        >
            {flag}
        </span>
    );

    // Portal to <body>: the drawer's CSS transform would otherwise trap this
    // fixed overlay inside the drawer instead of covering the viewport.
    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
            <div
                onClick={(e) => e.stopPropagation()}
                className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-border-token bg-surface p-6 shadow-xl"
            >
                <div className="flex items-start justify-between">
                    <h3 className="mb-1 text-lg font-bold text-text-primary">
                        {readOnly ? 'Document information' : 'Document details'}
                    </h3>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="cursor-pointer text-xl leading-none text-text-muted hover:text-text-primary"
                    >
                        ✕
                    </button>
                </div>
                <p className="mb-4 truncate text-sm text-text-muted">{doc.file.original_name}</p>

                {error && (
                    <div className="mb-4 rounded bg-danger-bg p-2 text-sm text-danger-text">{error}</div>
                )}

                <div className="space-y-4">
                    <div>
                        <span className="block text-sm font-medium text-text-secondary">About</span>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-text-primary">
                            {doc.file.about?.trim() || '—'}
                        </p>
                    </div>

                    <div>
                        <span className="block text-sm font-medium text-text-secondary">Tags</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                            {doc.file.tags?.trim()
                                ? doc.file.tags.split(',').map((t, i) =>
                                      t.trim() ? (
                                          <span
                                              key={i}
                                              className="rounded bg-surface-hover px-2 py-0.5 text-xs text-text-secondary"
                                          >
                                              {t.trim()}
                                          </span>
                                      ) : null,
                                  )
                                : <span className="text-sm text-text-muted">—</span>}
                        </div>
                    </div>

                    {readOnly ? (
                        <>
                            <div>
                                <span className="block text-sm font-medium text-text-secondary">
                                    Why put this document
                                </span>
                                <p className="mt-1 whitespace-pre-wrap text-sm text-text-primary">
                                    {description.trim() || '—'}
                                </p>
                            </div>
                            <div>
                                <span className="block text-sm font-medium text-text-secondary">Flag</span>
                                <div className="mt-1 flex items-center gap-2">
                                    {flagBadge}
                                    {flagNote.trim() && (
                                        <span className="text-sm text-text-secondary">{flagNote}</span>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label
                                    htmlFor="doc-description"
                                    className="block text-sm font-medium text-text-secondary"
                                >
                                    Why put this document
                                </label>
                                <textarea
                                    id="doc-description"
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label
                                        htmlFor="doc-flag"
                                        className="block text-sm font-medium text-text-secondary"
                                    >
                                        Flag
                                    </label>
                                    <select
                                        id="doc-flag"
                                        value={flag}
                                        onChange={(e) => setFlag(e.target.value)}
                                        className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                                    >
                                        {FLAG_OPTIONS.map((f) => (
                                            <option key={f} value={f}>
                                                {f}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label
                                        htmlFor="doc-flag-note"
                                        className="block text-sm font-medium text-text-secondary"
                                    >
                                        Flag note
                                    </label>
                                    <textarea
                                        id="doc-flag-note"
                                        rows={2}
                                        value={flagNote}
                                        onChange={(e) => setFlagNote(e.target.value)}
                                        className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Meta / provenance */}
                    <div className="rounded-lg border border-border-token bg-background p-3">
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                            {metaRows.map(([label, value]) => (
                                <div key={label}>
                                    <dt className="text-xs text-text-muted">{label}</dt>
                                    <dd className="text-sm text-text-primary">{value}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="cursor-pointer rounded border border-border-token bg-surface px-4 py-2 text-sm text-text-primary hover:bg-surface-hover"
                    >
                        Close
                    </button>
                    {!readOnly && (
                        <button
                            onClick={handleSave}
                            disabled={saving || !isDirty}
                            className="cursor-pointer rounded bg-primary px-4 py-2 text-sm font-medium text-primary-text hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
}
