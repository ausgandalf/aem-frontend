'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useStages } from '@/lib/useStages';
import Spinner from '@/components/Spinner';
import UploadDocumentModal from './UploadDocumentModal';
import DocumentDetailsModal from './DocumentDetailsModal';
import HoverTip from '@/components/HoverTip';
import { PencilIcon, EyeIcon } from '@/components/SVGs';

interface DocumentItem {
    id: number;
    description: string | null;
    flag: string;
    flag_note: string | null;
    stage_key: string | null;
    sector_key: string | null;
    created_at: string;
    submitted_by: string | null;
    updated_by: string | null;
    file: {
        original_name: string;
        mime_type: string | null;
        size: number;
        extension: string | null;
        about: string | null;
        tags: string | null;
    };
    view_url: string | null;
    thumbnail_url: string | null;
}

interface Props {
    applicationId: number;
    onCountChange?: (count: number) => void;
    readOnly?: boolean; // hide the upload control (view-only contexts)
}

const formatSize = (bytes: number) => {
    if (!bytes) return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    let n = bytes;
    let i = 0;
    while (n >= 1024 && i < units.length - 1) {
        n /= 1024;
        i++;
    }
    return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
};

const FLAG_CLASSES: Record<string, string> = {
    ok: 'bg-success-bg text-success-text',
    warning: 'bg-warning-bg text-warning-text',
    invalid: 'bg-danger-bg text-danger-text',
    ignore: 'bg-surface-dark text-text-muted',
};

const hasText = (v: string | null | undefined) => Boolean(v && v.trim() !== '');

export default function DocumentsPanel({ applicationId, onCountChange, readOnly = false }: Props) {
    const { getLabel } = useStages();
    const [docs, setDocs] = useState<DocumentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [detailsDoc, setDetailsDoc] = useState<DocumentItem | null>(null);

    const fetchDocs = useCallback(async () => {
        setLoading(true);
        const res = await api(`/api/applications/${applicationId}/documents`);
        if (res.ok) {
            const data: DocumentItem[] = await res.json();
            setDocs(data);
            onCountChange?.(data.length);
        }
        setLoading(false);
    }, [applicationId, onCountChange]);

    useEffect(() => {
        fetchDocs();
    }, [fetchDocs]);

    return (
        <div>
            {!readOnly && (
                <div className="mb-4 flex items-center justify-between md:flex-row md:items-center">
                    <p className="text-sm text-text-secondary">
                        Documents attached to this application.
                    </p>
                    <button
                        onClick={() => setUploadOpen(true)}
                        className="cursor-pointer rounded bg-primary px-4 py-2 text-sm font-medium text-primary-text hover:bg-primary-hover"
                    >
                        + Upload document
                    </button>
                </div>
            )}

            {loading && <Spinner label="Loading documents..." />}

            {!loading && docs.length === 0 && (
                <div className="rounded-lg border border-dashed border-border-token p-10 text-center text-text-muted">
                    No documents yet.
                </div>
            )}

            {!loading && docs.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-border-token">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-border-token bg-surface-dark text-text-secondary">
                            <tr>
                                <th className="px-4 py-3 font-medium"></th>
                                <th className="px-4 py-3 font-medium">File</th>
                                <th className="px-4 py-3 font-medium">Flag</th>
                                <th className="px-4 py-3 font-medium">Stage</th>
                                <th className="px-4 py-3 font-medium">Submitted by</th>
                                <th className="px-4 py-3 font-medium">Updated by</th>
                                <th className="px-4 py-3 font-medium">Uploaded</th>
                            </tr>
                        </thead>
                        <tbody>
                            {docs.map((d) => (
                                <tr
                                    key={d.id}
                                    className="border-b border-border-token last:border-b-0 hover:bg-surface-hover"
                                >
                                    <td className="whitespace-nowrap px-3 py-3 w-[70px]">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setDetailsDoc(d)}
                                                title="Details"
                                                aria-label="Document details"
                                                className="p-2 rounded border border-text-secondary cursor-pointer text-text-secondary hover:text-primary hover:border-primary"
                                            >
                                                <PencilIcon />
                                            </button>
                                            {d.view_url && (
                                                <a
                                                    href={d.view_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title="View file"
                                                    aria-label="View file"
                                                    className="p-2 rounded border border-text-secondary cursor-pointer text-text-secondary hover:text-primary hover:border-primary"
                                                >
                                                    <EyeIcon />
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            {d.thumbnail_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={d.thumbnail_url}
                                                    alt=""
                                                    className="h-10 w-10 rounded object-cover"
                                                />
                                            ) : (
                                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-surface-dark text-[10px] font-semibold uppercase text-text-muted">
                                                    {d.file.extension ?? 'file'}
                                                </span>
                                            )}
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    {(hasText(d.file.about) || hasText(d.description)) && (
                                                        <HoverTip>
                                                            <span className="block font-semibold text-text-primary">
                                                                About
                                                            </span>
                                                            <span className="block whitespace-pre-wrap">
                                                                {hasText(d.file.about) ? d.file.about : '—'}
                                                            </span>
                                                            <span className="mt-2 block font-semibold text-text-primary">
                                                                Why put this file
                                                            </span>
                                                            <span className="block whitespace-pre-wrap">
                                                                {hasText(d.description) ? d.description : '—'}
                                                            </span>
                                                        </HoverTip>
                                                    )}
                                                    <span className="truncate text-text-primary">
                                                        {d.file.original_name}
                                                    </span>
                                                </div>
                                                <div className='flex mt-1 items-center gap-1'>
                                                    <div className="text-xs text-text-muted">
                                                        {formatSize(d.file.size)}
                                                    </div>
                                                    <div className="flex max-w-[180px] items-center flex-wrap gap-1">
                                                        {hasText(d.file.tags)
                                                            ? d.file.tags!.split(',').map((t, i) =>
                                                                t.trim() ? (
                                                                    <span
                                                                        key={i}
                                                                        className="rounded bg-surface-dark px-2 py-0.5 text-xs text-text-secondary"
                                                                    >
                                                                        {t.trim()}
                                                                    </span>
                                                                ) : null,
                                                            )
                                                            : <span className="text-text-muted">—</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="flex items-center gap-1.5">
                                            <span
                                                className={`rounded px-2 py-0.5 text-xs font-medium ${
                                                    FLAG_CLASSES[d.flag] ?? 'bg-surface-hover text-text-muted'
                                                }`}
                                            >
                                                {d.flag}
                                            </span>
                                            {hasText(d.flag_note) && (
                                                <HoverTip>
                                                    <span className="block font-semibold text-text-primary">
                                                        Flag note
                                                    </span>
                                                    <span className="block whitespace-pre-wrap">
                                                        {d.flag_note}
                                                    </span>
                                                </HoverTip>
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-text-secondary">
                                        <div className='flex flex-col gap-2'>
                                            <span>{d.stage_key ? getLabel(d.stage_key) : '—'}</span>
                                            <span>{d.sector_key ?? '—'}</span>
                                        </div>
                                        
                                    </td>
                                    <td className="px-4 py-3 text-text-secondary">
                                        {d.submitted_by ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-text-secondary">
                                        {d.updated_by ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-text-muted">
                                        {new Date(d.created_at).toLocaleDateString()}
                                    </td>
                                    
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!readOnly && uploadOpen && (
                <UploadDocumentModal
                    applicationId={applicationId}
                    onClose={() => setUploadOpen(false)}
                    onUploaded={fetchDocs}
                />
            )}

            {detailsDoc && (
                <DocumentDetailsModal
                    applicationId={applicationId}
                    doc={detailsDoc}
                    onClose={() => setDetailsDoc(null)}
                    onSaved={fetchDocs}
                />
            )}
        </div>
    );
}
