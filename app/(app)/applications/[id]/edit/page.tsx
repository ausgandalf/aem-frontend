'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/Spinner';
import AboutOrganizationStep from '@/components/apply/AboutOrganizationStep';
import ProjectDetailsStep from '@/components/apply/ProjectDetailsStep';
import DocumentsPanel from '@/components/apply/DocumentsPanel';
import {
    ApplyFormData,
    OrganizationData,
    ProjectData,
    initialApplyData,
    applicationToFormData,
    buildApplyPayload,
} from '@/components/apply/types';

type Tab = 'organization' | 'project' | 'documents';

const TABS: { key: Tab; label: string }[] = [
    { key: 'organization', label: 'Organization' },
    { key: 'project', label: 'Project Details' },
    { key: 'documents', label: 'Documents' },
];

export default function OfficerEditPage() {
    const params = useParams();
    const router = useRouter();
    const applicationId = Number(params.id);
    const { user, roles, loading: authLoading } = useAuth();
    const isStaff = roles.some((r) => r !== 'applicant');

    const [tab, setTab] = useState<Tab>('organization');
    const [title, setTitle] = useState('');
    const [data, setData] = useState<ApplyFormData>(initialApplyData);
    const [loaded, setLoaded] = useState(false);
    const [forbidden, setForbidden] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [docCount, setDocCount] = useState(0);
    const formRef = useRef<HTMLFormElement>(null);

    // Guard: must be signed in, and staff (non-applicant) only.
    useEffect(() => {
        if (authLoading) return;
        if (!user) router.push('/login');
        else if (!isStaff) router.push(`/applications/${applicationId}`);
    }, [authLoading, user, isStaff, router, applicationId]);

    const load = useCallback(async () => {
        const res = await api(`/api/applications/${applicationId}`);
        if (res.ok) {
            const body = await res.json();
            setData(applicationToFormData(body.application));
            setTitle(body.application.project_title ?? 'Application');
            setDocCount(body.application.documents_count ?? 0);
            setForbidden(false);
        } else if (res.status === 403 || res.status === 404) {
            setForbidden(true);
        }
        setLoaded(true);
    }, [applicationId]);

    useEffect(() => {
        if (!authLoading && isStaff) load();
    }, [authLoading, isStaff, load]);

    const updateOrganization = (patch: Partial<OrganizationData>) =>
        setData((d) => ({ ...d, organization: { ...d.organization, ...patch } }));
    const updateProject = (patch: Partial<ProjectData>) =>
        setData((d) => ({ ...d, project: { ...d.project, ...patch } }));

    const save = async () => {
        if ((tab === 'organization' || tab === 'project') && !formRef.current?.reportValidity()) return;

        setSaving(true);
        setError('');
        setSuccess('');

        const res = await api(`/api/officer/applications/${applicationId}`, {
            method: 'PATCH',
            body: JSON.stringify(buildApplyPayload(data, false)),
        });
        const body = await res.json();

        if (res.ok) {
            setSuccess('Application updated.');
            setSaving(false);
            return;
        }

        const firstKey = body.errors ? Object.keys(body.errors)[0] : '';
        if (firstKey.startsWith('organization')) setTab('organization');
        else if (firstKey.startsWith('project')) setTab('project');

        const firstError = body.errors
            ? (Object.values(body.errors)[0] as string[])[0]
            : body.message;
        setError(firstError ?? 'Could not save. Please review your answers.');
        setSaving(false);
    };

    if (authLoading || (!loaded && isStaff)) {
        return (
            <div className="p-8">
                <Spinner label="Loading…" />
            </div>
        );
    }

    if (!isStaff) return null; // redirecting

    if (forbidden) {
        return (
            <div className="p-8">
                <button
                    onClick={() => router.back()}
                    className="mb-4 cursor-pointer text-sm text-primary hover:underline"
                >
                    ← Back
                </button>
                <div className="rounded-lg border border-dashed border-border-token p-12 text-center text-text-muted">
                    You don&apos;t have access to edit this application.
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <button
                onClick={() => router.push(`/applications/${applicationId}`)}
                className="mb-3 cursor-pointer text-sm text-primary hover:underline"
            >
                ← Back to application
            </button>

            <h1 className="mb-1 text-2xl font-bold text-text-primary">Edit: {title}</h1>
            <p className="mb-6 text-sm text-text-muted">
                Editing organization &amp; project details. This does not change the workflow stage.
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
                        {t.key === 'documents' ? ` (${docCount})` : ''}
                    </button>
                ))}
            </div>

            {error && (
                <div className="mb-6 rounded bg-danger-bg p-3 text-sm text-danger-text">{error}</div>
            )}
            {success && (
                <div className="mb-6 rounded bg-success-bg p-3 text-sm text-success-text">{success}</div>
            )}

            <div className="max-w-3xl">
                <form ref={formRef}>
                    {tab === 'organization' && (
                        <AboutOrganizationStep value={data.organization} onChange={updateOrganization} />
                    )}
                    {tab === 'project' && (
                        <ProjectDetailsStep value={data.project} onChange={updateProject} />
                    )}
                </form>

                {tab === 'documents' && (
                    <DocumentsPanel applicationId={applicationId} onCountChange={setDocCount} />
                )}
            </div>

            {tab !== 'documents' && (
                <div className="mt-8 flex max-w-3xl justify-end gap-3">
                    <button
                        onClick={() => router.push(`/applications/${applicationId}`)}
                        className="cursor-pointer rounded border border-border-token bg-surface px-4 py-2 text-sm text-text-primary hover:bg-surface-hover"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={save}
                        disabled={saving}
                        className="cursor-pointer rounded bg-primary px-6 py-2 text-sm font-medium text-primary-text hover:bg-primary-hover disabled:opacity-50"
                    >
                        {saving ? 'Saving…' : 'Save changes'}
                    </button>
                </div>
            )}
        </div>
    );
}
