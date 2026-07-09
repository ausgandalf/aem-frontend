'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

interface PublicOrg {
    id: number;
    name: string;
    registered_city: string | null;
    registered_country: string | null;
}

interface Props {
    value: number | null;
    label: string;
    onChange: (id: number | null, label: string) => void;
}

const orgSubtitle = (o: PublicOrg) =>
    [o.registered_city, o.registered_country].filter(Boolean).join(', ');

// Public type-ahead over /api/organizations. Selecting an org sets its id;
// clearing the text resets to null so the manual register form can show.
export default function PublicOrganizationCombobox({ value, label, onChange }: Props) {
    const [query, setQuery] = useState(label);
    const [results, setResults] = useState<PublicOrg[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const requestId = useRef(0);

    useEffect(() => {
        setQuery(label);
    }, [label]);

    useEffect(() => {
        if (!open) return;
        const currentRequest = ++requestId.current;
        setLoading(true);

        const timer = setTimeout(async () => {
            const params = new URLSearchParams();
            if (query) params.set('search', query);
            const res = await api(`/api/organizations?${params.toString()}`);
            if (currentRequest !== requestId.current) return; // ignore stale response
            setResults(res.ok ? await res.json() : []);
            setLoading(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [query, open]);

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    const handleSelect = (org: PublicOrg) => {
        onChange(org.id, org.name);
        setQuery(org.name);
        setOpen(false);
    };

    const handleClear = () => {
        onChange(null, '');
        setQuery('');
        setResults([]);
    };

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                <input
                    type="text"
                    placeholder="Start typing your organization's name..."
                    value={query}
                    onFocus={() => setOpen(true)}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                        if (value !== null) onChange(null, e.target.value);
                    }}
                    className="w-full rounded border border-border-token bg-surface px-3 py-2 pr-8 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
                />
                {value !== null && (
                    <button
                        type="button"
                        onClick={handleClear}
                        aria-label="Clear selection"
                        className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted hover:text-text-primary"
                    >
                        ×
                    </button>
                )}
            </div>

            {open && (
                <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded border border-border-token bg-surface shadow-lg">
                    {loading && <li className="px-3 py-2 text-sm text-text-muted">Searching...</li>}

                    {!loading && results.length === 0 && (
                        <li className="px-3 py-2 text-sm text-text-muted">
                            No match — you can register your organization below.
                        </li>
                    )}

                    {!loading &&
                        results.map((org) => (
                            <li key={org.id}>
                                <button
                                    type="button"
                                    onClick={() => handleSelect(org)}
                                    className="block w-full cursor-pointer px-3 py-2 text-left hover:bg-surface-hover"
                                >
                                    <span className="block text-sm text-text-primary">{org.name}</span>
                                    {orgSubtitle(org) && (
                                        <span className="block text-xs text-text-muted">
                                            {orgSubtitle(org)}
                                        </span>
                                    )}
                                </button>
                            </li>
                        ))}
                </ul>
            )}
        </div>
    );
}
