'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useStages } from '@/lib/useStages';
import { api } from '@/lib/api';
import Spinner from '@/components/Spinner';
import StatusBadge from '@/components/apply/StatusBadge';
import ApplicationProgressDrawer from '@/components/apply/ApplicationProgressDrawer';
import { ApplicationCard } from '@/components/apply/types';

interface StageGroup {
    stage: { key: string; label: string; order: number };
    applications: ApplicationCard[];
}

const formatAmount = (amount: string | null, currency: string) => {
    if (amount == null) return '—';
    const n = Number(amount);
    return `${currency} ${Number.isNaN(n) ? amount : n.toLocaleString()}`;
};

export default function OfficerApplications() {
    const { getLabel } = useStages();
    const [groups, setGroups] = useState<StageGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [summaryId, setSummaryId] = useState<number | null>(null);

    const fetchQueue = useCallback(async () => {
        setLoading(true);
        const res = await api('/api/officer/applications');
        if (res.ok) setGroups(await res.json());
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchQueue();
    }, [fetchQueue]);

    return (
        <div className="p-8">
            <h1 className="mb-6 text-2xl font-bold text-text-primary">Applications</h1>

            {loading && <Spinner label="Loading your review queue..." />}

            {!loading &&
                groups.map((group) => (
                    <section key={group.stage.key} className="mb-10">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text-primary">
                            {group.stage.label}
                            <span className="rounded-full bg-surface-dark px-2 py-0.5 text-xs font-medium text-text-secondary">
                                {group.applications.length}
                            </span>
                        </h2>

                        {group.applications.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-border-token p-8 text-center text-sm text-text-muted">
                                No applications at this stage.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {group.applications.map((app) => (
                                    <ReviewCard
                                        key={app.id}
                                        app={app}
                                        stageKey={group.stage.key}
                                        getLabel={getLabel}
                                        onSummary={() => setSummaryId(app.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                ))}

            {!loading && groups.length === 0 && (
                <div className="rounded-lg border border-dashed border-border-token p-12 text-center text-text-muted">
                    No stages are assigned to your role.
                </div>
            )}

            {summaryId !== null && (
                <ApplicationProgressDrawer
                    applicationId={summaryId}
                    onClose={() => setSummaryId(null)}
                />
            )}
        </div>
    );
}

function ReviewCard({
    app,
    stageKey,
    getLabel,
    onSummary,
}: {
    app: ApplicationCard;
    stageKey: string;
    getLabel: (k?: string | null) => string;
    onSummary: () => void;
}) {
    return (
        <div className="flex flex-col rounded-lg border border-border-token bg-surface p-5 shadow-sm">
            <h3 className="mb-3 truncate font-semibold text-text-primary">{app.project_title}</h3>

            <div className="mb-4 text-lg font-bold text-primary">
                {formatAmount(app.requested_amount, app.currency)}
            </div>

            <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-text-secondary">Current</span>
                    <span className="flex items-center gap-2">
                        <span className="text-text-primary">{getLabel(app.current_stage)}</span>
                        <StatusBadge status={app.current_status} />
                    </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <span className="text-text-secondary">Previous</span>
                    <span className="flex items-center gap-2">
                        <span className="text-text-muted">
                            {app.prev_stage ? getLabel(app.prev_stage) : '—'}
                        </span>
                        <StatusBadge status={app.prev_status} />
                    </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <span className="text-text-secondary">Documents</span>
                    <span className="text-text-primary">📎 {app.documents_count}</span>
                </div>
            </div>

            <div className="mt-5 flex gap-2">
                <button
                    onClick={onSummary}
                    className="flex-1 cursor-pointer rounded border border-border-token bg-surface px-3 py-2 text-sm font-medium text-text-primary hover:bg-surface-hover"
                >
                    Summary
                </button>
                <Link
                    href={`/applications/${app.id}/process/${stageKey}`}
                    className="flex-1 rounded bg-primary px-3 py-2 text-center text-sm font-medium text-primary-text hover:bg-primary-hover"
                >
                    Process
                </Link>
            </div>
        </div>
    );
}
