'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useRoles } from '@/context/RolesContext';
import Spinner from '@/components/Spinner';

interface Props {
    userId: number;
    onClose: () => void;
    onChanged: () => void;
}

interface UserDetail {
    id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    email: string;
    phone: string | null;
    role: string;
    status: string;
    created_at: string;
}

interface Log {
    id: number;
    action: string;
    details: string | null;
    created_at: string;
    actioned_by: { id: number; first_name: string; last_name: string } | null;
}

export default function UserDrawer({ userId, onClose, onChanged }: Props) {
    const [tab, setTab] = useState<'details' | 'edit' | 'logs'>('details');
    const [user, setUser] = useState<UserDetail | null>(null);
    const [logs, setLogs] = useState<Log[]>([]);
    const [logsLoaded, setLogsLoaded] = useState(false);
    const [visible, setVisible] = useState(false);
    const { roles: availableRoles, getLabel } = useRoles();
    const [form, setForm] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        phone: '',
        role: '',
    });
    const [original, setOriginal] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        phone: '',
        role: '',
    });
    const isDirty = (Object.keys(form) as (keyof typeof form)[])
        .some((key) => form[key] !== original[key]);

    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Trigger slide-in after mount
    useEffect(() => {
        const frame = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    // Slide-out then unmount
    const handleClose = useCallback(() => {
        setVisible(false);
        setTimeout(onClose, 300); // matches transition duration
    }, [onClose]);

    // Close on Escape key
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [handleClose]);

    useEffect(() => {
        api(`/api/admin/users/${userId}`)
            .then((res) => res.json())
            .then((data) => {
                setUser(data.user);
                const values = {
                    first_name: data.user.first_name ?? '',
                    middle_name: data.user.middle_name ?? '',
                    last_name: data.user.last_name ?? '',
                    phone: data.user.phone ?? '',
                    role: data.user.role ?? '',
                };
                setForm(values);
                setOriginal(values);
            });
    }, [userId]);

    useEffect(() => {
        if (tab === 'logs' && !logsLoaded) {
            api(`/api/admin/users/${userId}/logs`)
                .then((res) => res.json())
                .then((data) => {
                    setLogs(data.data);
                    setLogsLoaded(true);
                });
        }
    }, [tab, logsLoaded, userId]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSaveMessage(null);

        const res = await api(`/api/admin/users/${userId}`, {
            method: 'PATCH',
            body: JSON.stringify(form),
        });

        const data = await res.json();

        if (res.ok) {
            setUser(data.user);
            setOriginal({ ...form });
            setSaveMessage({ type: 'success', text: 'Saved successfully' });
            onChanged(); // refresh the table behind the drawer
        } else {
            setSaveMessage({ type: 'error', text: data.message ?? 'Save failed' });
        }

        setSaving(false);
    };

    return (
        <>
            {/* Backdrop - fades in/out */}
            <div
                className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
                    visible ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={handleClose}
            />

            {/* Drawer - slides from right */}
            <div
                className={`fixed right-0 top-0 z-50 h-full w-128 overflow-y-auto border-l border-border-token bg-surface shadow-xl transition-transform duration-300 ease-out ${
                    visible ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex items-center justify-between border-b border-border-token p-4">
                    <h2 className="text-lg font-bold text-text-primary">
                        {user ? `${user.first_name} ${user.last_name}` : 'User Details'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-xl text-text-muted hover:text-text-primary"
                    >
                        ✕
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border-token">
                    <button
                        onClick={() => setTab('details')}
                        className={`cursor-pointer flex-1 py-2 text-sm font-medium ${
                            tab === 'details'
                                ? 'border-b-2 border-primary text-primary'
                                : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        Details
                    </button>
                    <button
                        onClick={() => setTab('edit')}
                        className={`cursor-pointer flex-1 py-2 text-sm font-medium ${
                            tab === 'edit'
                                ? 'border-b-2 border-primary text-primary'
                                : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => setTab('logs')}
                        className={`cursor-pointer flex-1 py-2 text-sm font-medium ${
                            tab === 'logs'
                                ? 'border-b-2 border-primary text-primary'
                                : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        Activity Logs
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {tab === 'details' && !user && <Spinner label="Loading user..." />}
                    {tab === 'details' && user && (
                        <div className="space-y-3 text-sm text-text-primary">
                            <div>
                                <span className="text-text-secondary">Email:</span> {user.email}
                            </div>
                            <div>
                                <span className="text-text-secondary">Phone:</span>{' '}
                                {user.phone ?? '—'}
                            </div>
                            <div>
                                <span className="text-text-secondary">Role:</span> {getLabel(user.role)}
                            </div>
                            <div>
                                <span className="text-text-secondary">Status:</span> {user.status}
                            </div>
                            <div>
                                <span className="text-text-secondary">Joined:</span>{' '}
                                {new Date(user.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    )}

                    {tab === 'edit' && !user && <Spinner label="Loading user..." />}

                    {tab === 'edit' && user && (
                        <form onSubmit={handleSave} className="space-y-4">
                            {saveMessage && (
                                <div
                                    className={`rounded p-3 text-sm ${
                                        saveMessage.type === 'success'
                                            ? 'bg-success-bg text-success-text'
                                            : 'bg-danger-bg text-danger-text'
                                    }`}
                                >
                                    {saveMessage.text}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-text-secondary">
                                    First name
                                </label>
                                <input
                                    type="text"
                                    value={form.first_name}
                                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                                    required
                                    className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary">
                                    Middle name
                                </label>
                                <input
                                    type="text"
                                    value={form.middle_name}
                                    onChange={(e) => setForm({ ...form, middle_name: e.target.value })}
                                    className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary">
                                    Last name
                                </label>
                                <input
                                    type="text"
                                    value={form.last_name}
                                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                                    required
                                    className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary">
                                    Phone
                                </label>
                                <input
                                    type="text"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary">
                                    Role
                                </label>
                                <select
                                    value={form.role}
                                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                                    className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                                >
                                    {availableRoles.map((r) => (
                                        <option key={r.name} value={r.name}>
                                            {r.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={saving || !isDirty}
                                className="cursor-pointer w-full rounded bg-primary py-2 font-medium text-primary-text hover:bg-primary-hover disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save changes'}
                            </button>
                        </form>
                    )}

                    {tab === 'logs' && (
                        <div className="space-y-3">
                            {!logsLoaded && <Spinner label="Loading activity..." />}

                            {logsLoaded && logs.length === 0 && (
                                <p className="text-sm text-text-muted">No activity yet</p>
                            )}

                            {logsLoaded &&
                                logs.map((log) => (
                                    <div
                                        key={log.id}
                                        className="border-l-2 border-primary/30 pl-3 text-sm"
                                    >
                                        <div className="font-medium text-text-primary">
                                            {log.action}
                                        </div>
                                        {log.details && (
                                            <div className="text-text-secondary">{log.details}</div>
                                        )}
                                        <div className="text-xs text-text-muted">
                                            {new Date(log.created_at).toLocaleString()}
                                            {log.actioned_by &&
                                                ` — by ${log.actioned_by.first_name} ${log.actioned_by.last_name}`}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}