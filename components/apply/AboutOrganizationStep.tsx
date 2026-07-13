'use client';

import LabelWithTip from './LabelWithTip';
import AddressFields, { AddressValue } from './AddressFields';
import PublicOrganizationCombobox from './PublicOrganizationCombobox';
import { OrganizationData, CURRENCY_OPTIONS } from './types';
import { ORG_FINANCIAL_TIPS } from './tips';

interface Props {
    value: OrganizationData;
    onChange: (patch: Partial<OrganizationData>) => void;
}

export default function AboutOrganizationStep({ value, onChange }: Props) {
    const showRegisterForm = value.organization_id === null;

    const text = (
        key: keyof OrganizationData,
        label: string,
        opts?: { required?: boolean; type?: string; tip?: string },
    ) => (
        <div>
            <LabelWithTip
                label={label}
                required={opts?.required}
                tip={opts?.tip}
                htmlFor={`org-${key}`}
            />
            <input
                id={`org-${key}`}
                type={opts?.type ?? 'text'}
                value={value[key] as string}
                onChange={(e) => onChange({ [key]: e.target.value })}
                required={opts?.required}
                className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
            />
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <LabelWithTip
                    label="Select your organization"
                    tip="Search for your organization. If it isn't listed, leave this empty and register it below."
                />
                <div className="mt-1">
                    <PublicOrganizationCombobox
                        value={value.organization_id}
                        label={value.label}
                        onChange={(id, label) => onChange({ organization_id: id, label })}
                    />
                </div>
            </div>

            {showRegisterForm && (
                <div className="space-y-4 rounded-lg border border-border-token bg-surface p-4">
                    <p className="text-sm font-medium text-text-primary">
                        Register your organization
                    </p>
                    <p className="text-xs text-text-muted">
                        Can&apos;t find your organization above? Fill in its details here.
                    </p>

                    {text('name', 'Organization name', { required: true })}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {text('type', 'Type', { required: true })}
                        {text('legal_status', 'Legal status', { required: true })}
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {text('registration_number', 'Registration number', { required: true })}
                        {text('founded_year', 'Founded year', { type: 'number', required: true })}
                    </div>

                    <div className="pt-2">
                        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
                            Registered address
                        </p>
                        <AddressFields
                            idPrefix="org-addr"
                            required
                            value={value.address}
                            onChange={(patch: Partial<AddressValue>) =>
                                onChange({ address: { ...value.address, ...patch } })
                            }
                        />
                    </div>

                    <div className="pt-2">
                        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
                            Contact
                        </p>
                        <div className="space-y-4">
                            {text('contact_email', 'Contact email', { type: 'email', required: true })}
                            {text('contact_phone', 'Contact phone', { required: true })}
                            {text('website_url', 'Website URL', { type: 'url', required: true })}
                        </div>
                    </div>

                    <div className="pt-2">
                        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
                            Financials
                        </p>
                        <div className="space-y-4">
                            <div>
                                <LabelWithTip
                                    label="Currency"
                                    required
                                    tip={ORG_FINANCIAL_TIPS.currency}
                                    htmlFor="org-currency"
                                />
                                <select
                                    id="org-currency"
                                    value={value.currency}
                                    onChange={(e) => onChange({ currency: e.target.value })}
                                    required
                                    className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                                >
                                    {CURRENCY_OPTIONS.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {text('annual_income', 'Annual income', {
                                type: 'number',
                                required: true,
                                tip: ORG_FINANCIAL_TIPS.annual_income,
                            })}
                            {text('annual_expenditure', 'Annual expenditure', {
                                type: 'number',
                                required: true,
                                tip: ORG_FINANCIAL_TIPS.annual_expenditure,
                            })}
                            <div>
                                <LabelWithTip
                                    label="Reserves policy"
                                    required
                                    tip={ORG_FINANCIAL_TIPS.reserves_policy}
                                    htmlFor="org-reserves_policy"
                                />
                                <textarea
                                    id="org-reserves_policy"
                                    rows={3}
                                    value={value.reserves_policy}
                                    onChange={(e) => onChange({ reserves_policy: e.target.value })}
                                    required
                                    className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
