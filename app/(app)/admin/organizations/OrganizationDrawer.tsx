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
    // Core identity
    name: string;
    registration_number: string;
    legal_status: string;
    type: string;
    founded_year: string;
    // Registered address
    registered_country: string;
    registered_state_province: string;
    registered_city: string;
    registered_address_line1: string;
    registered_address_line2: string;
    registered_postal_code: string;
    // Operating / correspondence address
    current_country: string;
    current_state_province: string;
    current_city: string;
    current_address_line1: string;
    current_address_line2: string;
    current_postal_code: string;
    // Contact
    contact_email: string;
    contact_phone: string;
    website_url: string;
    // Social
    social_facebook: string;
    social_linkedin: string;
    social_twitter: string;
    social_instagram: string;
    social_youtube: string;
    social_whatsapp: string;
    // Financials
    currency: string;
    annual_income: string;
    annual_expenditure: string;
    reserves_policy: string;
    // Metadata
    status: string;
    note: string;
}

const emptyForm: OrgForm = {
    name: '',
    registration_number: '',
    legal_status: '',
    type: '',
    founded_year: '',
    registered_country: '',
    registered_state_province: '',
    registered_city: '',
    registered_address_line1: '',
    registered_address_line2: '',
    registered_postal_code: '',
    current_country: '',
    current_state_province: '',
    current_city: '',
    current_address_line1: '',
    current_address_line2: '',
    current_postal_code: '',
    contact_email: '',
    contact_phone: '',
    website_url: '',
    social_facebook: '',
    social_linkedin: '',
    social_twitter: '',
    social_instagram: '',
    social_youtube: '',
    social_whatsapp: '',
    currency: 'GBP',
    annual_income: '',
    annual_expenditure: '',
    reserves_policy: '',
    status: 'pending',
    note: '',
};

const STATUS_OPTIONS = ['pending', 'verified', 'off'];
const CURRENCY_OPTIONS = ['GBP', 'USD', 'EUR', 'NGN', 'KES', 'ZAR'];

export default function OrganizationDrawer({ orgId, onClose, onChanged }: Props) {
    const isCreate = orgId === null;

    const [form, setForm] = useState<OrgForm>(emptyForm);
    const [original, setOriginal] = useState<OrgForm>(emptyForm);
    // Tracked separately from the string form since it's a boolean
    const [sameAsReg, setSameAsReg] = useState(true);
    const [origSameAsReg, setOrigSameAsReg] = useState(true);
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
                const o = data.organization;
                // Map every field, coercing null/number to a string for the inputs
                const values: OrgForm = {
                    ...emptyForm,
                    ...Object.fromEntries(
                        (Object.keys(emptyForm) as (keyof OrgForm)[]).map((k) => [
                            k,
                            o[k] === null || o[k] === undefined ? emptyForm[k] : String(o[k]),
                        ]),
                    ),
                } as OrgForm;
                setForm(values);
                setOriginal(values);
                const same = o.current_same_as_registered ?? true;
                setSameAsReg(same);
                setOrigSameAsReg(same);
                setLoaded(true);
            });
    }, [orgId]);

    const isDirty =
        (Object.keys(form) as (keyof OrgForm)[]).some((key) => form[key] !== original[key]) ||
        sameAsReg !== origSameAsReg;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSaveMessage(null);

        // If the operating address mirrors the registered one, don't send stale values
        const payload = {
            ...form,
            current_same_as_registered: sameAsReg,
            ...(sameAsReg
                ? {
                      current_country: '',
                      current_state_province: '',
                      current_city: '',
                      current_address_line1: '',
                      current_address_line2: '',
                      current_postal_code: '',
                  }
                : {}),
        };

        const res = await api(
            isCreate ? '/api/admin/organizations' : `/api/admin/organizations/${orgId}`,
            {
                method: isCreate ? 'POST' : 'PATCH',
                body: JSON.stringify(payload),
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
                setOrigSameAsReg(sameAsReg);
            }
        } else {
            const firstError = data.errors
                ? (Object.values(data.errors)[0] as string[])[0]
                : data.message;
            setSaveMessage({ type: 'error', text: firstError ?? 'Save failed' });
        }

        setSaving(false);
    };

    const set = (key: keyof OrgForm, value: string) =>
        setForm((f) => ({ ...f, [key]: value }));

    const field = (
        label: string,
        key: keyof OrgForm,
        options?: {
            required?: boolean;
            textarea?: boolean;
            type?: 'text' | 'email' | 'url' | 'number';
            placeholder?: string;
            select?: string[];
        },
    ) => (
        <div>
            <label className="block text-sm font-medium text-text-secondary">
                {label}
                {options?.required && <span className="text-danger"> *</span>}
            </label>
            {options?.select ? (
                <select
                    value={form[key]}
                    onChange={(e) => set(key, e.target.value)}
                    className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                >
                    {options.select.map((opt) => (
                        <option key={opt} value={opt}>
                            {opt}
                        </option>
                    ))}
                </select>
            ) : options?.textarea ? (
                <textarea
                    value={form[key]}
                    onChange={(e) => set(key, e.target.value)}
                    rows={3}
                    placeholder={options?.placeholder}
                    className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
                />
            ) : (
                <input
                    type={options?.type ?? 'text'}
                    value={form[key]}
                    onChange={(e) => set(key, e.target.value)}
                    required={options?.required}
                    placeholder={options?.placeholder}
                    className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
                />
            )}
        </div>
    );

    const section = (title: string) => (
        <h3 className="border-b border-border-token pb-1 pt-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
            {title}
        </h3>
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
                className={`fixed right-0 top-0 z-50 h-full w-full overflow-y-auto border-l border-border-token bg-surface shadow-xl transition-transform duration-300 ease-out sm:w-[520px] ${
                    visible ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border-token bg-surface p-4">
                    <h2 className="text-lg font-bold text-text-primary">
                        {isCreate ? 'New Organization' : form.name || 'Organization'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="cursor-pointer text-xl text-text-muted hover:text-text-primary"
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

                            {section('Core identity')}
                            {field('Name', 'name', { required: true })}
                            {field('Registration number', 'registration_number')}
                            {field('Legal status', 'legal_status', {
                                placeholder: 'Registered Charity, Non-Profit...',
                            })}
                            {field('Type', 'type', {
                                placeholder: 'NGO, Charity, Foundation...',
                            })}
                            {field('Founded year', 'founded_year', {
                                type: 'number',
                                placeholder: '2015',
                            })}

                            {section('Registered address')}
                            {field('Country', 'registered_country')}
                            {field('State / Province', 'registered_state_province')}
                            {field('City', 'registered_city')}
                            {field('Address line 1', 'registered_address_line1')}
                            {field('Address line 2', 'registered_address_line2')}
                            {field('Postcode / ZIP', 'registered_postal_code')}

                            {section('Operating / correspondence address')}
                            <label className="flex items-center gap-2 text-sm text-text-primary">
                                <input
                                    type="checkbox"
                                    checked={sameAsReg}
                                    onChange={(e) => setSameAsReg(e.target.checked)}
                                    className="h-4 w-4 rounded border-border-token"
                                />
                                Same as registered address
                            </label>
                            {!sameAsReg && (
                                <>
                                    {field('Country', 'current_country')}
                                    {field('State / Province', 'current_state_province')}
                                    {field('City', 'current_city')}
                                    {field('Address line 1', 'current_address_line1')}
                                    {field('Address line 2', 'current_address_line2')}
                                    {field('Postcode / ZIP', 'current_postal_code')}
                                </>
                            )}

                            {section('Contact')}
                            {field('Contact email', 'contact_email', { type: 'email' })}
                            {field('Contact phone', 'contact_phone')}
                            {field('Website URL', 'website_url', {
                                type: 'url',
                                placeholder: 'https://...',
                            })}

                            {section('Social')}
                            {field('Facebook', 'social_facebook')}
                            {field('LinkedIn', 'social_linkedin')}
                            {field('Twitter / X', 'social_twitter')}
                            {field('Instagram', 'social_instagram')}
                            {field('YouTube', 'social_youtube')}
                            {field('WhatsApp', 'social_whatsapp')}

                            {section('Financials')}
                            {field('Currency', 'currency', { select: CURRENCY_OPTIONS })}
                            {field('Annual income', 'annual_income', {
                                type: 'number',
                                placeholder: '0.00',
                            })}
                            {field('Annual expenditure', 'annual_expenditure', {
                                type: 'number',
                                placeholder: '0.00',
                            })}
                            {field('Reserves policy', 'reserves_policy', { textarea: true })}

                            {section('Metadata')}
                            {field('Status', 'status', { select: STATUS_OPTIONS })}
                            {field('Note', 'note', { textarea: true })}

                            <button
                                type="submit"
                                disabled={saving || !isDirty}
                                className="w-full cursor-pointer rounded bg-primary py-2 font-medium text-primary-text hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
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
