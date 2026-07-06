'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import Spinner from '@/components/Spinner';

interface Props {
    orgId: number | null; // null = create mode
    onClose: () => void;
    onChanged: () => void;
}

interface OrgForm {
    name: string;
    country: string;
    type: string;
    note: string;
    legal_status: string;
    register_no: string;
}

const emptyForm: OrgForm = {
    name: '',
    country: '',
    type: '',
    note: '',
    legal_status: '',
    register_no: '',
};

export default function OrganizationDrawer({ orgId, onClose, onChanged }: Props) {
    const isCreate = orgId === null;

    const [form, setForm] = useState<OrgForm>(emptyForm);
    const [original, setOriginal] = useState<OrgForm>(emptyForm);
    const [loaded, setLoaded] = useState(isCreate);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);
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

    useEffect(() => {
        if (orgId === null) return;

        api(`/api/admin/organizations/${orgId}`)
            .then((res) => res.json())
            .then((data) => {
                const values: OrgForm = {
                    name: data.organization.name ?? '',
                    country: data.organization.country ?? '',
                    type: data.organization.type ?? '',
                    note: data.organization.note ?? '',
                    legal_status: data.organization.legal_status ?? '',
                    register_no: data.organization.register_no ?? '',
                };
                setForm(values);
                setOriginal(values);
                setLoaded(true);
            });
    }, [orgId]);

    const isDirty = (Object.keys(form) as (keyof OrgForm)[]).some(
        (key) => form[key] !== original[key],
    );

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSaveMessage(null);

        const res = await api(
            isCreate ? '/api/admin/organizations' : `/api/admin/organizations/${orgId}`,
            {
                method: isCreate ? 'POST' : 'PATCH',
                body: JSON.stringify(form),
            },
        );

        const data = await res.json();

        if (res.ok) {
            setSaveMessage({
                type: 'success',
                text: isCreate ? 'Organization created' : 'Saved successfully',
            });
            onChanged();

            if (isCreate) {
                setTimeout(handleClose, 800);
            } else {
                setOriginal({ ...form });
            }
        } else {
            setSaveMessage({ type: 'error', text: data.message ?? 'Save failed' });
        }

        setSaving(false);
    };

    const field = (
        label: string,
        key: keyof OrgForm,
        options?: { required?: boolean; textarea?: boolean; placeholder?: string },
    ) => (
        <div>
            <label className="block text-sm font-medium text-text-secondary">
                {label}
                {options?.required && <span className="text-danger"> *</span>}
            </label>
            {options?.textarea ? (
                <textarea
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    rows={3}
                    placeholder={options?.placeholder}
                    className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
                />
            ) : (
                <input
                    type="text"
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    required={options?.required}
                    placeholder={options?.placeholder}
                    className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
                />
            )}
        </div>
    );

    return (
        <>
            <div
                className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
                    visible ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={handleClose}
            />

            <div
                className={`fixed right-0 top-0 z-50 h-full w-full overflow-y-auto border-l border-border-token bg-surface shadow-xl transition-transform duration-300 ease-out sm:w-[440px] ${
                    visible ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex items-center justify-between border-b border-border-token p-4">
                    <h2 className="text-lg font-bold text-text-primary">
                        {isCreate ? 'New Organization' : form.name || 'Organization'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-xl text-text-muted hover:text-text-primary"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-4">
                    {!loaded && <Spinner label="Loading organization..." />}

                    {loaded && (
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

                            {field('Name', 'name', { required: true })}
                            {field('Country code', 'country', {
                                required: true,
                                placeholder: 'US, GB, NG...',
                            })}
                            {field('Type', 'type', {
                                placeholder: 'NGO, Charity, Foundation...',
                            })}
                            {field('Legal status', 'legal_status')}
                            {field('Register number', 'register_no')}
                            {field('Note', 'note', { textarea: true })}

                            <button
                                type="submit"
                                disabled={saving || !isDirty}
                                className="w-full rounded bg-primary py-2 font-medium text-primary-text hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {saving
                                    ? 'Saving...'
                                    : isCreate
                                      ? 'Create organization'
                                      : 'Save changes'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </>
    );
}