'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Spinner from '@/components/Spinner';
import InspectionAccordion from './InspectionAccordion';
import CompleteDrawer from './CompleteDrawer';
import { ProcessData, ProcessInspection } from './types';

// Tabs are meant to vary per stage later; for now every stage shows Review.
const TABS = [{ key: 'review', label: 'Review' }];

function groupBySection(inspections: ProcessInspection[]) {
    const groups: { section: string; items: ProcessInspection[] }[] = [];
    const index = new Map<string, number>();
    for (const insp of inspections) {
        const section = insp.sector_section?.trim() || 'General';
        if (!index.has(section)) {
            index.set(section, groups.length);
            groups.push({ section, items: [] });
        }
        groups[index.get(section)!].items.push(insp);
    }
    return groups;
}

export default function ProcessPage() {
    const params = useParams();
    const router = useRouter();
    const applicationId = Number(params.id);
    const stageKey = String(params.stage);

    const [data, setData] = useState<ProcessData | null>(null);
    const [loading, setLoading] = useState(true);
    const [forbidden, setForbidden] = useState(false);
    const [tab, setTab] = useState('review');
    const [completeOpen, setCompleteOpen] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const res = await api(`/api/applications/${applicationId}/process/${stageKey}`);
        if (res.ok) {
            setData(await res.json());
            setForbidden(false);
        } else if (res.status === 403 || res.status === 404) {
            setForbidden(true);
        }
        setLoading(false);
    }, [applicationId, stageKey]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div className="p-8">
                <Spinner label="Loading…" />
            </div>
        );
    }

    if (forbidden || !data) {
        return (
            <div className="p-8">
                <button
                    onClick={() => router.push('/review')}
                    className="mb-4 cursor-pointer text-sm text-primary hover:underline"
                >
                    ← Back to applications
                </button>
                <div className="rounded-lg border border-dashed border-border-token p-12 text-center text-text-muted">
                    You don&apos;t have access to this page.
                </div>
            </div>
        );
    }

    const groups = groupBySection(data.inspections);

    return (
        <div className="p-8">
            <button
                onClick={() => router.push('/review')}
                className="mb-3 cursor-pointer text-sm text-primary hover:underline"
            >
                ← Back to applications
            </button>

            <div className="mb-1 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-text-primary">{data.application.project_title}</h1>
                {data.read_only && (
                    <span className="rounded bg-warning-bg px-2 py-0.5 text-xs font-medium text-warning-text">
                        Read-only
                    </span>
                )}
                {!data.read_only && (
                    <button
                        onClick={() => setCompleteOpen(true)}
                        className="ml-auto cursor-pointer rounded bg-primary px-4 py-2 text-sm font-medium text-primary-text hover:bg-primary-hover"
                    >
                        Complete
                    </button>
                )}
            </div>
            <p className="mb-6 text-sm text-text-muted">
                Stage: <span className="font-medium text-text-secondary">{data.stage.label}</span>
                {data.read_only && ' — this application is not currently at this stage.'}
            </p>

            {/* Tabs */}
            <div className="mb-6 flex gap-1 border-b border-border-token">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`cursor-pointer border-b-2 px-4 py-2 text-sm font-medium transition ${
                            tab === t.key
                                ? 'border-primary text-primary'
                                : 'border-transparent text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Review tab */}
            {tab === 'review' && (
                <div className="space-y-8">
                    {groups.length === 0 && (
                        <div className="rounded-lg border border-dashed border-border-token p-12 text-center text-text-muted">
                            No review items for this stage.
                        </div>
                    )}

                    {groups.map((group) => (
                        <section key={group.section}>
                            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
                                {group.section}
                            </h2>
                            <div className="space-y-2">
                                {group.items.map((insp) => (
                                    <InspectionAccordion
                                        key={insp.id}
                                        inspection={insp}
                                        applicationId={data.application.id}
                                        stageKey={data.stage.key}
                                        readOnly={data.read_only}
                                        onChanged={fetchData}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            {completeOpen && (
                <CompleteDrawer
                    applicationId={data.application.id}
                    stageKey={data.stage.key}
                    stageLabel={data.stage.label}
                    onClose={() => setCompleteOpen(false)}
                    onDone={() => {
                        setCompleteOpen(false);
                        router.push('/review');
                    }}
                />
            )}
        </div>
    );
}
