'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';

interface Props {
    userId: number;
    userName: string;
    onClose: () => void;
}

export default function ChangePasswordModal({ userId, userName, onClose }: Props) {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            e.stopPropagation(); // don't let the drawer behind us also close
            onClose();
        };
        // Capture phase so we run before the drawer's own Escape listener
        window.addEventListener('keydown', onKey, true);
        return () => window.removeEventListener('keydown', onKey, true);
    }, [onClose]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        const res = await api(`/api/admin/users/${userId}/password`, {
            method: 'PUT',
            body: JSON.stringify({ password, password_confirmation: confirm }),
        });
        const data = await res.json();

        if (res.ok) {
            setMessage({ type: 'success', text: 'Password updated' });
            setPassword('');
            setConfirm('');
            setTimeout(onClose, 800);
        } else {
            const firstError = data.errors
                ? (Object.values(data.errors)[0] as string[])[0]
                : data.message;
            setMessage({ type: 'error', text: firstError ?? 'Update failed' });
            setSaving(false);
        }
    };

    // Portal to <body> so a transformed ancestor (drawer) can't trap the overlay
    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-lg border border-border-token bg-surface p-6 shadow-xl"
            >
                <div className="flex items-start justify-between">
                    <h3 className="text-lg font-bold text-text-primary">Change password</h3>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="cursor-pointer text-xl leading-none text-text-muted hover:text-text-primary"
                    >
                        ✕
                    </button>
                </div>
                <p className="mb-4 text-sm text-text-muted">for {userName}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {message && (
                        <div
                            className={`rounded p-2 text-sm ${
                                message.type === 'success'
                                    ? 'bg-success-bg text-success-text'
                                    : 'bg-danger-bg text-danger-text'
                            }`}
                        >
                            {message.text}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-text-secondary">
                            New password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                            className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                        />
                        <p className="mt-1 text-xs text-text-muted">
                            At least 8 characters, with upper &amp; lower case and a number.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary">
                            Confirm password
                        </label>
                        <input
                            type="password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            required
                            autoComplete="new-password"
                            className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="cursor-pointer rounded border border-border-token bg-surface px-4 py-2 text-sm text-text-primary hover:bg-surface-hover"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="cursor-pointer rounded bg-primary px-4 py-2 text-sm font-medium text-primary-text hover:bg-primary-hover disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body,
    );
}
