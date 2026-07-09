'use client';

import LabelWithTip from './LabelWithTip';
import { ApplicantData, CONTACT_OPTIONS } from './types';

interface Props {
    value: ApplicantData;
    onChange: (patch: Partial<ApplicantData>) => void;
}

export default function AboutYouStep({ value, onChange }: Props) {
    const toggleContact = (v: string) => {
        onChange({
            preferred_contact: value.preferred_contact.includes(v)
                ? value.preferred_contact.filter((x) => x !== v)
                : [...value.preferred_contact, v],
        });
    };

    const text = (
        key: keyof ApplicantData,
        label: string,
        opts?: { required?: boolean; type?: string },
    ) => (
        <div>
            <LabelWithTip label={label} required={opts?.required} htmlFor={`you-${key}`} />
            <input
                id={`you-${key}`}
                type={opts?.type ?? 'text'}
                value={value[key] as string}
                onChange={(e) => onChange({ [key]: e.target.value })}
                required={opts?.required}
                className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
            />
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {text('first_name', 'First name', { required: true })}
                {text('middle_name', 'Middle name')}
                {text('last_name', 'Last name', { required: true })}
            </div>

            {text('email', 'Email', { required: true, type: 'email' })}
            {text('phone', 'Phone', { required: true })}

            <div>
                <LabelWithTip
                    label="Preferred contact"
                    required
                    tip="How should we get in touch with you? Select all that apply."
                />
                <div className="mt-2 flex flex-wrap gap-4">
                    {CONTACT_OPTIONS.map((opt) => (
                        <label
                            key={opt.value}
                            className="flex items-center gap-2 text-sm text-text-primary"
                        >
                            <input
                                type="checkbox"
                                checked={value.preferred_contact.includes(opt.value)}
                                onChange={() => toggleContact(opt.value)}
                                className="h-4 w-4 rounded border-border-token"
                            />
                            {opt.label}
                        </label>
                    ))}
                </div>
            </div>

            {text('referred_from', 'How did you hear about WRBLO?', { required: true })}
            {text('position', 'What is your position in the organization?', { required: true })}
        </div>
    );
}
