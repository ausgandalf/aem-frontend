'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

const CONTACT_OPTIONS: { value: string; label: string }[] = [
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'SMS' },
    { value: 'scheduled_call', label: 'Scheduled call' },
];

export default function ProfilePage() {
    const { user, refresh } = useAuth();

    const [form, setForm] = useState({
        first_name: user?.first_name ?? '',
        middle_name: user?.middle_name ?? '',
        last_name: user?.last_name ?? '',
        email: user?.email ?? '',
        phone: user?.phone ?? '',
        preferred_contact: user?.preferred_contact ?? [],
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    if (!user) return null;

    const toggleContact = (value: string) => {
        setForm((f) => ({
            ...f,
            preferred_contact: f.preferred_contact.includes(value)
                ? f.preferred_contact.filter((v) => v !== value)
                : [...f.preferred_contact, value],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        const res = await api('/api/profile', {
            method: 'PATCH',
            body: JSON.stringify(form),
        });
        const data = await res.json();

        if (res.ok) {
            await refresh(); // pull the updated user into context (name in avatar, etc.)
            setMessage({ type: 'success', text: data.message ?? 'Profile updated' });
        } else {
            // Laravel validation errors come back under `errors`
            const firstError = data.errors
                ? (Object.values(data.errors)[0] as string[])[0]
                : data.message;
            setMessage({ type: 'error', text: firstError ?? 'Update failed' });
        }

        setSaving(false);
    };

    return (
        <div className="p-8">
            <h1 className="mb-6 text-2xl font-bold text-text-primary">Profile</h1>

            <form
                onSubmit={handleSubmit}
                className="max-w-xl space-y-4 rounded-lg border border-border-token bg-surface p-6 shadow-sm"
            >
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
                    <label className="block text-sm font-medium text-text-secondary">First name</label>
                    <input
                        type="text"
                        value={form.first_name}
                        onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                        required
                        className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-secondary">Middle name</label>
                    <input
                        type="text"
                        value={form.middle_name}
                        onChange={(e) => setForm({ ...form, middle_name: e.target.value })}
                        className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-secondary">Last name</label>
                    <input
                        type="text"
                        value={form.last_name}
                        onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                        required
                        className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-secondary">Email</label>
                    <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                        className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-text-muted">
                        Changing your email requires re-verifying the new address.
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-secondary">Phone</label>
                    <input
                        type="text"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                    />
                </div>

                <div>
                    <span className="block text-sm font-medium text-text-secondary">
                        Preferred contact method
                    </span>
                    <div className="mt-2 flex gap-4">
                        {CONTACT_OPTIONS.map((opt) => (
                            <label key={opt.value} className="flex items-center gap-2 text-sm text-text-primary">
                                <input
                                    type="checkbox"
                                    checked={form.preferred_contact.includes(opt.value)}
                                    onChange={() => toggleContact(opt.value)}
                                    className="h-4 w-4 rounded border-border-token"
                                />
                                {opt.label}
                            </label>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="w-full cursor-pointer rounded bg-primary py-2 font-medium text-primary-text hover:bg-primary-hover disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save changes'}
                </button>
            </form>
        </div>
    );
}
