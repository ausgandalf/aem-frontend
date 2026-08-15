'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/Spinner';
import StatusBadge from '@/components/apply/StatusBadge';
import ApplicationDetailsPanel from '@/components/apply/ApplicationDetailsPanel';
import { PencilIcon } from '@/components/SVGs';
import { ApplicationDetail, ProgressStage } from '@/components/apply/types';

export default function ApplicationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const applicationId = Number(params.id);
    const { user, roles, loading: authLoading } = useAuth();

    const isStaff = roles.some((r) => r !== 'applicant');

    const [application, setApplication] = useState<ApplicationDetail | null>(null);
    const [progress, setProgress] = useState<ProgressStage[]>([]);
    const [loading, setLoading] = useState(true);
    const [forbidden, setForbidden] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [authLoading, user, router]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const res = await api(`/api/applications/${applicationId}`);
        if (res.ok) {
            const body = await res.json();
            setApplication(body.application);
            setProgress(body.progress ?? []);
            setForbidden(false);
        } else if (res.status === 403 || res.status === 404) {
            setForbidden(true);
        }
        setLoading(false);
    }, [applicationId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (authLoading || loading) {
        return (
            <div className="p-8">
                <Spinner label="Loading…" />
            </div>
        );
    }

    if (forbidden || !application) {
        return (
            <div className="p-8">
                <button
                    onClick={() => router.back()}
                    className="mb-4 cursor-pointer text-sm text-primary hover:underline"
                >
                    ← Back
                </button>
                <div className="rounded-lg border border-dashed border-border-token p-12 text-center text-text-muted">
                    You don&apos;t have access to this application.
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <button
                onClick={() => router.back()}
                className="mb-3 cursor-pointer text-sm text-primary hover:underline"
            >
                ← Back
            </button>

            <div className="mb-6 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-text-primary">{application.project_title}</h1>
                <StatusBadge status={application.current_status} />
                {isStaff && (
                    <Link
                        href={`/applications/${applicationId}/edit`}
                        className="ml-auto flex items-center gap-1.5 rounded border border-text-secondary px-3 py-1.5 text-sm text-text-secondary hover:border-primary hover:text-primary"
                    >
                        <PencilIcon size={14} />
                        Edit
                    </Link>
                )}
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr]">
                {/* Progress timeline */}
                <div className="lg:sticky lg:top-6 lg:self-start">
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-muted">
                        Progress
                    </h3>
                    <ol className="relative border-l border-border-token">
                        {progress.map((stage) => {
                            const isCurrent = application.current_stage === stage.key;
                            const reached = stage.status !== null;
                            return (
                                <li key={stage.key} className="mb-8 ml-6">
                                    <span
                                        className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                                            isCurrent
                                                ? 'bg-primary text-primary-text'
                                                : reached
                                                  ? 'bg-selected text-primary-text'
                                                  : 'border border-border-token bg-surface text-text-muted'
                                        }`}
                                    >
                                        {stage.order + 1}
                                    </span>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h4
                                            className={`text-sm font-medium ${
                                                isCurrent ? 'text-text-primary' : 'text-text-secondary'
                                            }`}
                                        >
                                            {stage.label}
                                        </h4>
                                        <StatusBadge status={stage.status} />
                                        {isCurrent && (
                                            <span className="text-xs font-medium text-primary">Current</span>
                                        )}
                                    </div>
                                    {stage.note && (
                                        <p className="mt-1 text-xs text-text-muted">{stage.note}</p>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                </div>

                {/* Details (role-aware documents inside) */}
                <div>
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-muted">
                        Details
                    </h3>
                    <ApplicationDetailsPanel application={application} />
                </div>
            </div>
        </div>
    );
}
