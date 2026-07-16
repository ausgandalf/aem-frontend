'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useStages } from '@/lib/useStages';
import Spinner from '@/components/Spinner';
import StatusBadge from '@/components/apply/StatusBadge';
import ApplicationEditDrawer from '@/components/apply/ApplicationEditDrawer';
import ApplicationProgressDrawer from '@/components/apply/ApplicationProgressDrawer';
import { ApplicationCard } from '@/components/apply/types';

const formatAmount = (amount: string | null, currency: string) => {
    if (amount == null) return '—';
    const n = Number(amount);
    return `${currency} ${Number.isNaN(n) ? amount : n.toLocaleString()}`;
};

export default function ApplicationsPage() {
    const { getLabel } = useStages();
    const [apps, setApps] = useState<ApplicationCard[]>([]);
    const [loading, setLoading] = useState(true);
    // null = closed, 'new' = create, number = edit that application
    const [editTarget, setEditTarget] = useState<number | 'new' | null>(null);
    const [progressTarget, setProgressTarget] = useState<number | null>(null);

    const fetchApps = useCallback(async () => {
        setLoading(true);
        const res = await api('/api/applications');
        if (res.ok) setApps(await res.json());
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchApps();
    }, [fetchApps]);

    const openCard = (app: ApplicationCard) => {
        if (app.current_stage === 'submit') {
            setEditTarget(app.id); // still editable
        } else {
            setProgressTarget(app.id); // show progress
        }
    };

    return (
        <div className="p-8">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-text-primary">My Applications</h1>
                <button
                    onClick={() => setEditTarget('new')}
                    className="cursor-pointer rounded bg-primary px-4 py-2 text-sm font-medium text-primary-text hover:bg-primary-hover"
                >
                    + New Application
                </button>
            </div>

            {loading && <Spinner label="Loading applications..." />}

            {!loading && apps.length === 0 && (
                <div className="rounded-lg border border-dashed border-border-token p-12 text-center text-text-muted">
                    You haven&apos;t submitted any applications yet.
                </div>
            )}

            {!loading && apps.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {apps.map((app) => (
                        <button
                            key={app.id}
                            onClick={() => openCard(app)}
                            className="cursor-pointer rounded-lg border border-border-token bg-surface p-5 text-left shadow-sm transition hover:border-primary hover:shadow-md"
                        >
                            <h2 className="mb-3 truncate font-semibold text-text-primary">
                                {app.project_title}
                            </h2>

                            <div className="mb-4 text-lg font-bold text-primary">
                                {formatAmount(app.requested_amount, app.currency)}
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-text-secondary">Current</span>
                                    <span className="flex items-center gap-2">
                                        <span className="text-text-primary">
                                            {getLabel(app.current_stage)}
                                        </span>
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

                            {app.current_stage === 'submit' && (
                                <p className="mt-4 text-xs text-primary">Click to edit</p>
                            )}
                            {app.current_stage !== 'submit' && (
                                <p className="mt-4 text-xs text-text-muted">Click to view progress</p>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {editTarget !== null && (
                <ApplicationEditDrawer
                    applicationId={editTarget === 'new' ? null : editTarget}
                    onClose={() => setEditTarget(null)}
                    onSaved={fetchApps}
                />
            )}

            {progressTarget !== null && (
                <ApplicationProgressDrawer
                    applicationId={progressTarget}
                    onClose={() => setProgressTarget(null)}
                />
            )}
        </div>
    );
}
