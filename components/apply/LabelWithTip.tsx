'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
    label: string;
    tip?: string;
    required?: boolean;
    htmlFor?: string;
}

// A field label with an optional "?" tip icon that reveals guidance on click.
export default function LabelWithTip({ label, tip, required, htmlFor }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        function onClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    return (
        <div className="flex items-center gap-1.5">
            <label htmlFor={htmlFor} className="block text-sm font-medium text-text-secondary">
                {label}
                {required && <span className="text-danger"> *</span>}
            </label>
            {tip && (
                <span ref={ref} className="relative inline-flex">
                    <button
                        type="button"
                        onClick={() => setOpen((v) => !v)}
                        aria-label="More information"
                        className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border border-border-token text-[10px] font-bold text-text-muted hover:bg-surface-hover"
                    >
                        ?
                    </button>
                    {open && (
                        <span className="absolute left-6 top-0 z-30 w-64 rounded-lg border border-border-token bg-surface p-3 text-xs font-normal leading-relaxed text-text-secondary shadow-lg">
                            {tip}
                        </span>
                    )}
                </span>
            )}
        </div>
    );
}
