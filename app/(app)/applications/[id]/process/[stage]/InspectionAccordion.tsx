'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import HoverTip from '@/components/HoverTip';
import { PencilIcon, EyeIcon, TrashIcon, PlusIcon } from '@/components/SVGs';
import UploadDocumentModal from '@/components/apply/UploadDocumentModal';
import DocumentDetailsModal from '@/components/apply/DocumentDetailsModal';
import StatusChangerDrawer from './StatusChangerDrawer';
import { ProcessDoc, ProcessInspection } from './types';

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

const hasText = (v: string | null | undefined) => Boolean(v && v.trim() !== '');

function InspectionStatusBadge({ status }: { status: string | null }) {
    const map: Record<string, string> = {
        approved: 'bg-success-bg text-success-text',
        rejected: 'bg-danger-bg text-danger-text',
        pending: 'bg-warning-bg text-warning-text',
    };
    if (!status) return <span className="text-text-muted">—</span>;
    return (
        <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${map[status] ?? 'bg-surface-hover text-text-muted'}`}>
            {status}
        </span>
    );
}

interface Props {
    inspection: ProcessInspection;
    applicationId: number;
    stageKey: string;
    readOnly: boolean;
    onChanged: () => void;
}

export default function InspectionAccordion({
    inspection,
    applicationId,
    stageKey,
    readOnly,
    onChanged,
}: Props) {
    const [open, setOpen] = useState(false);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [statusOpen, setStatusOpen] = useState(false);
    const [detailsDoc, setDetailsDoc] = useState<ProcessDoc | null>(null);

    const deleteDoc = async (doc: ProcessDoc) => {
        if (!confirm(`Delete "${doc.file.original_name}"?`)) return;
        const res = await api(`/api/applications/${applicationId}/documents/${doc.id}`, {
            method: 'DELETE',
        });
        if (res.ok) onChanged();
        else {
            const data = await res.json();
            alert(data.message ?? 'Delete failed');
        }
    };

    return (
        <div className="overflow-hidden rounded-lg border border-border-token bg-surface">
            {/* Header (click to expand) */}
            <div
                onClick={() => setOpen((o) => !o)}
                className="flex flex-wrap justify-between cursor-pointer items-center gap-3 px-4 py-3 hover:bg-surface-hover"
            >
                <div className="min-w-0 flex items-center gap-2">
                    {hasText(inspection.sector_description) ? (
                        <span className="flex items-center" onClick={(e) => e.stopPropagation()}>
                            <HoverTip>
                                <span className="block whitespace-pre-wrap">{inspection.sector_description}</span>
                            </HoverTip>
                        </span>
                    ) : (
                        <span className="inline-flex h-4 w-4 shrink-0" />
                    )}

                    <div className="min-w-0 flex items-center gap-2 flex-1">
                        <PlusIcon
                            size={16}
                            className={`shrink-0 text-text-muted transition-transform duration-300 ${open ? 'rotate-45' : ''}`}
                        />
                        <span className="font-medium text-text-primary">
                            {inspection.sector_label ?? inspection.sector_key}
                        </span>
                    </div>
                </div>

                <div className="min-w-0 flex items-center gap-2 ps-6">
                    <InspectionStatusBadge status={inspection.status} />

                    <span className="whitespace-nowrap text-xs text-text-muted">
                        📎 {inspection.documents_count}
                    </span>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setStatusOpen(true);
                        }}
                        disabled={readOnly}
                        className="rounded border border-text-secondary px-2.5 py-1 text-xs text-text-secondary hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Status
                    </button>

                    {!readOnly && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setUploadOpen(true);
                            }}
                            className="rounded border border-text-secondary px-2.5 py-1 text-xs text-text-secondary hover:border-primary hover:text-primary"
                        >
                            Upload
                        </button>
                    )}
                </div>
            </div>

            {/* Body */}
            <div
                className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                    open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}
            >
                <div className="overflow-hidden">
                    <div className="border-t border-border-token px-4 py-3">
                        {hasText(inspection.note) && (
                            <div className="mb-3 rounded bg-surface-dark p-3 text-sm text-text-secondary">
                                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-text-muted">
                                    Note
                                </span>
                                <span className="whitespace-pre-wrap">{inspection.note}</span>
                            </div>
                        )}

                        {inspection.documents.length === 0 ? (
                            <p className="text-sm text-text-muted">No files.</p>
                        ) : (
                            <ul className="space-y-2">
                                {inspection.documents.map((doc) => (
                                    <li
                                        key={doc.id}
                                        className="flex items-center gap-3 rounded border border-border-token px-3 py-2"
                                    >
                                        {(hasText(doc.file.about) || hasText(doc.description)) && (
                                            <HoverTip>
                                                <span className="block font-semibold text-text-primary">About</span>
                                                <span className="block whitespace-pre-wrap">
                                                    {hasText(doc.file.about) ? doc.file.about : '—'}
                                                </span>
                                                <span className="mt-2 block font-semibold text-text-primary">
                                                    Why put this file
                                                </span>
                                                <span className="block whitespace-pre-wrap">
                                                    {hasText(doc.description) ? doc.description : '—'}
                                                </span>
                                            </HoverTip>
                                        )}

                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm text-text-primary">
                                                {doc.file.original_name}
                                            </div>
                                            <div className="text-xs text-text-muted">
                                                {formatSize(doc.file.size)}
                                                {hasText(doc.file.tags) ? ` · ${doc.file.tags}` : ''}
                                            </div>
                                        </div>

                                        {doc.view_url && (
                                            <a
                                                href={doc.view_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title="View file"
                                                className="rounded border border-text-secondary p-1.5 text-text-secondary hover:border-primary hover:text-primary"
                                            >
                                                <EyeIcon size={14} />
                                            </a>
                                        )}

                                        {!readOnly && (
                                            <button
                                                onClick={() => setDetailsDoc(doc)}
                                                title="Edit details"
                                                className="rounded border border-text-secondary p-1.5 text-text-secondary hover:border-primary hover:text-primary"
                                            >
                                                <PencilIcon size={14} />
                                            </button>
                                        )}

                                        {doc.can_delete && (
                                            <button
                                                onClick={() => deleteDoc(doc)}
                                                title="Delete file"
                                                className="rounded border border-text-secondary p-1.5 text-text-secondary hover:border-danger hover:text-danger"
                                            >
                                                <TrashIcon size={14} />
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            {uploadOpen && (
                <UploadDocumentModal
                    applicationId={applicationId}
                    stageKey={stageKey}
                    sectorKey={inspection.sector_key}
                    onClose={() => setUploadOpen(false)}
                    onUploaded={onChanged}
                />
            )}

            {detailsDoc && (
                <DocumentDetailsModal
                    applicationId={applicationId}
                    doc={detailsDoc}
                    onClose={() => setDetailsDoc(null)}
                    onSaved={onChanged}
                />
            )}

            {statusOpen && (
                <StatusChangerDrawer
                    inspection={inspection}
                    onClose={() => setStatusOpen(false)}
                    onSaved={onChanged}
                />
            )}
        </div>
    );
}
