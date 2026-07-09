'use client';

import { useRef } from 'react';
import LabelWithTip from './LabelWithTip';

export interface AddressValue {
    country: string;
    state_province: string;
    city: string;
    address_line1: string;
    address_line2: string;
    postal_code: string;
}

export const emptyAddress: AddressValue = {
    country: '',
    state_province: '',
    city: '',
    address_line1: '',
    address_line2: '',
    postal_code: '',
};

interface Props {
    value: AddressValue;
    onChange: (patch: Partial<AddressValue>) => void;
    required?: boolean;
    idPrefix: string;
}

/**
 * Reusable address block.
 *
 * Google Places drop-in point: attach the autocomplete to `line1Ref`.
 * When you add a key (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) and load the Places
 * library, initialise it here and, on place selection, call `onChange({...})`
 * with the parsed components. Until then this is a plain text address block.
 */
export default function AddressFields({ value, onChange, required, idPrefix }: Props) {
    const line1Ref = useRef<HTMLInputElement>(null);

    const input = (
        key: keyof AddressValue,
        label: string,
        opts?: { required?: boolean; ref?: React.RefObject<HTMLInputElement | null> },
    ) => (
        <div>
            <LabelWithTip label={label} required={opts?.required} htmlFor={`${idPrefix}-${key}`} />
            <input
                id={`${idPrefix}-${key}`}
                ref={opts?.ref}
                type="text"
                value={value[key]}
                onChange={(e) => onChange({ [key]: e.target.value })}
                required={opts?.required}
                className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
        </div>
    );

    return (
        <div className="space-y-4">
            {input('address_line1', 'Address line 1', { required, ref: line1Ref })}
            {input('address_line2', 'Address line 2')}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {input('city', 'City', { required })}
                {input('state_province', 'State / Province')}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {input('postal_code', 'Postcode / ZIP')}
                {input('country', 'Country', { required })}
            </div>
        </div>
    );
}
