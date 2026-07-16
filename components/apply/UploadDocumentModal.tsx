'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';

interface Props {
    applicationId: number;
    onClose: () => void;
    onUploaded: () => void;
}

export default function UploadDocumentModal({ applicationId, onClose, onUploaded }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [about, setAbout] = useState('');
    const [tags, setTags] = useState('');
    const [busy, setBusy] = useState<'' | 'uploading' | 'saving'>('');
    const [error, setError] = useState('');

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            e.stopPropagation(); // don't let the drawer behind us also close
            if (!busy) onClose();
        };
        // Capture phase so we run before the drawer's own Escape listener
        window.addEventListener('keydown', onKey, true);
        return () => window.removeEventListener('keydown', onKey, true);
    }, [onClose, busy]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;
        setError('');

        try {
            // 1. Ask the API for a short-lived S3 PUT URL (keyed under documents/{applicationId}/)
            const presignRes = await api(`/api/applications/${applicationId}/documents/presign`, {
                method: 'POST',
                body: JSON.stringify({ filename: file.name, mime_type: file.type }),
            });
            const presign = await presignRes.json();
            if (!presignRes.ok) {
                setError(presign.message ?? 'Could not start the upload.');
                return;
            }

            // 2. Upload the bytes straight to S3 (raw fetch — NOT the api() helper,
            //    which would attach cookies/CSRF and break the cross-origin request)
            setBusy('uploading');
            const putRes = await fetch(presign.url, {
                method: 'PUT',
                body: file,
                headers: presign.headers ?? {},
            });
            if (!putRes.ok) {
                setError('Upload to storage failed. Please try again.');
                setBusy('');
                return;
            }

            // 3. Record the file + document in the API
            setBusy('saving');
            const saveRes = await api(`/api/applications/${applicationId}/documents`, {
                method: 'POST',
                body: JSON.stringify({
                    object_key: presign.object_key,
                    original_name: file.name,
                    mime_type: file.type,
                    about,
                    tags,
                }),
            });
            const saved = await saveRes.json();
            if (!saveRes.ok) {
                setError(saved.message ?? 'Could not save the document.');
                setBusy('');
                return;
            }

            onUploaded();
            onClose();
        } catch {
            setError('Something went wrong during the upload.');
            setBusy('');
        }
    };

    const uploading = busy !== '';

    // Portal to <body>: the drawer's CSS transform would otherwise trap this
    // fixed overlay inside the drawer instead of covering the viewport.
    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-lg border border-border-token bg-surface p-6 shadow-xl"
            >
                <div className="mb-4 flex items-start justify-between">
                    <h3 className="text-lg font-bold text-text-primary">Upload document</h3>
                    <button
                        onClick={onClose}
                        disabled={uploading}
                        aria-label="Close"
                        className="cursor-pointer text-xl leading-none text-text-muted hover:text-text-primary disabled:opacity-50"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="rounded bg-danger-bg p-2 text-sm text-danger-text">{error}</div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-text-secondary">File</label>
                        <input
                            type="file"
                            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                            required
                            className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-sm text-text-primary file:mr-3 file:rounded file:border-0 file:bg-surface-hover file:px-3 file:py-1 file:text-text-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary">About</label>
                        <textarea
                            value={about}
                            onChange={(e) => setAbout(e.target.value)}
                            rows={3}
                            className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary">
                            Tags
                        </label>
                        <input
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="e.g. budget, evidence, report"
                            className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
                        />
                        <p className="mt-1 text-xs text-text-muted">Separate tags with commas.</p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={uploading}
                            className="cursor-pointer rounded border border-border-token bg-surface px-4 py-2 text-sm text-text-primary hover:bg-surface-hover disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={uploading || !file}
                            className="cursor-pointer rounded bg-primary px-4 py-2 text-sm font-medium text-primary-text hover:bg-primary-hover disabled:opacity-50"
                        >
                            {busy === 'uploading' ? 'Uploading...' : busy === 'saving' ? 'Saving...' : 'Upload'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body,
    );
}
