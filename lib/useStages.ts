'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export interface StageInfo {
    key: string;
    label: string;
    role: string;
    order: number;
}

// Stages rarely change, so cache them at module scope to avoid refetching.
let cache: StageInfo[] | null = null;

export function useStages() {
    const [stages, setStages] = useState<StageInfo[]>(cache ?? []);
    const [loading, setLoading] = useState(!cache);

    useEffect(() => {
        if (cache) return;
        api('/api/stages')
            .then((r) => (r.ok ? r.json() : []))
            .then((data: StageInfo[]) => {
                cache = data;
                setStages(data);
            })
            .finally(() => setLoading(false));
    }, []);

    const getLabel = (key?: string | null) =>
        stages.find((s) => s.key === key)?.label ?? key ?? '—';

    return { stages, loading, getLabel };
}
