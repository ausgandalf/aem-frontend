'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export default function SettingsPage() {
    const [form, setForm] = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        const res = await api('/api/password', {
            method: 'PUT',
            body: JSON.stringify(form),
        });
        const data = await res.json();

        if (res.ok) {
            setForm({ current_password: '', password: '', password_confirmation: '' });
            setMessage({ type: 'success', text: data.message ?? 'Password changed' });
        } else {
            const firstError = data.errors
                ? (Object.values(data.errors)[0] as string[])[0]
                : data.message;
            setMessage({ type: 'error', text: firstError ?? 'Update failed' });
        }

        setSaving(false);
    };

    return (
        <div className="p-8">
            <h1 className="mb-6 text-2xl font-bold text-text-primary">Settings</h1>

            <form
                onSubmit={handleSubmit}
                className="max-w-xl space-y-4 rounded-lg border border-border-token bg-surface p-6 shadow-sm"
            >
                <h2 className="text-lg font-semibold text-text-primary">Change password</h2>

                {message && (
                    <div
                        className={`rounded p-3 text-sm ${
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
                        Current password
                    </label>
                    <input
                        type="password"
                        value={form.current_password}
                        onChange={(e) => setForm({ ...form, current_password: e.target.value })}
                        required
                        autoComplete="current-password"
                        className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-secondary">
                        New password
                    </label>
                    <input
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
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
                        Confirm new password
                    </label>
                    <input
                        type="password"
                        value={form.password_confirmation}
                        onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                        required
                        autoComplete="new-password"
                        className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                    />
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="w-full cursor-pointer rounded bg-primary py-2 font-medium text-primary-text hover:bg-primary-hover disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Change password'}
                </button>
            </form>
        </div>
    );
}
