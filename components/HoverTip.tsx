'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const TIP_WIDTH = 256; // matches w-64
const EDGE_MARGIN = 8;

interface TipPos {
    top: number;
    left: number;
    above: boolean;
}

/**
 * Small "i" icon that reveals its children in a tooltip on hover (or tap).
 *
 * The tooltip is portaled to <body> with fixed positioning so it can never be
 * clipped by an overflow-x-auto table wrapper or a transformed drawer — the
 * two things that were cutting tips off and spawning surprise scrollbars.
 */
export default function HoverTip({ children }: { children: React.ReactNode }) {
    const ref = useRef<HTMLSpanElement>(null);
    const [pos, setPos] = useState<TipPos | null>(null);

    const show = () => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;

        // Clamp horizontally so the tip stays on screen (matters on mobile)
        const left = Math.max(
            EDGE_MARGIN,
            Math.min(r.left, window.innerWidth - TIP_WIDTH - EDGE_MARGIN),
        );

        // Flip above the icon when there's little room below
        const above = window.innerHeight - r.bottom < 220;

        setPos({ top: above ? r.top - 6 : r.bottom + 6, left, above });
    };

    const hide = () => setPos(null);

    // Any scroll would leave a fixed tooltip stranded — just dismiss it
    useEffect(() => {
        if (!pos) return;
        window.addEventListener('scroll', hide, true);
        return () => window.removeEventListener('scroll', hide, true);
    }, [pos]);

    return (
        <span
            ref={ref}
            onMouseEnter={show}
            onMouseLeave={hide}
            onClick={() => (pos ? hide() : show())} // tap support on touch screens
            className="inline-flex shrink-0"
        >
            <span className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border text-[10px] font-bold text-primary">
                i
            </span>
            {pos &&
                createPortal(
                    <span
                        style={{
                            top: pos.top,
                            left: pos.left,
                            width: TIP_WIDTH,
                            transform: pos.above ? 'translateY(-100%)' : undefined,
                        }}
                        className="pointer-events-none fixed z-[80] block rounded-lg border border-border-token bg-surface p-3 text-xs font-normal leading-relaxed text-text-secondary shadow-lg"
                    >
                        {children}
                    </span>,
                    document.body,
                )}
        </span>
    );
}
