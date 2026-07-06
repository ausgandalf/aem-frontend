'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

interface Organization {
    id: number;
    name: string;
}

interface OrganizationComboboxProps {
    value: number | null;
    label: string;
    onChange: (id: number | null, label: string) => void;
}

export default function OrganizationCombobox({ value, label, onChange }: OrganizationComboboxProps) {
    const [query, setQuery] = useState(label);
    const [results, setResults] = useState<Organization[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const requestId = useRef(0);

    // Keep the input text in sync if the parent clears/changes selection externally
    useEffect(() => {
        setQuery(label);
    }, [label]);

    // Debounced search-as-you-type against the existing organizations index endpoint
    useEffect(() => {
        if (!open) return;

        const currentRequest = ++requestId.current;
        setLoading(true);

        const timer = setTimeout(async () => {
            const params = new URLSearchParams();
            if (query) params.set('search', query);
            params.set('per_page', '8');

            const res = await api(`/api/admin/organizations?${params.toString()}`);

            // Ignore stale responses if a newer keystroke already fired a request
            if (currentRequest !== requestId.current) return;

            if (res.ok) {
                const data = await res.json();
                setResults(data.data ?? []);
            } else {
                setResults([]);
            }
            setLoading(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [query, open]);

    // Close the dropdown when clicking outside the component
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (org: Organization) => {
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
        <div ref={containerRef} className="relative w-64">
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search organization..."
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
                        aria-label="Clear organization filter"
                        className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted hover:text-text-primary"
                    >
                        ×
                    </button>
                )}
            </div>

            {open && (
                <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded border border-border-token bg-surface shadow-lg">
                    {loading && (
                        <li className="px-3 py-2 text-sm text-text-muted">Searching...</li>
                    )}

                    {!loading && results.length === 0 && (
                        <li className="px-3 py-2 text-sm text-text-muted">No organizations found</li>
                    )}

                    {!loading &&
                        results.map((org) => (
                            <li key={org.id}>
                                <button
                                    type="button"
                                    onClick={() => handleSelect(org)}
                                    className="w-full cursor-pointer px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-hover"
                                >
                                    {org.name}
                                </button>
                            </li>
                        ))}
                </ul>
            )}
        </div>
    );
}
