'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import Spinner from '@/components/Spinner';
import AboutOrganizationStep from './AboutOrganizationStep';
import ProjectDetailsStep from './ProjectDetailsStep';
import {
    ApplyFormData,
    OrganizationData,
    ProjectData,
    initialApplyData,
    applicationToFormData,
    buildApplyPayload,
} from './types';

interface Props {
    applicationId: number | null; // null = create a new application
    onClose: () => void;
    onSaved: () => void;
}

export default function ApplicationEditDrawer({ applicationId, onClose, onSaved }: Props) {
    const isCreate = applicationId === null;

    const [data, setData] = useState<ApplyFormData>(initialApplyData);
    const [loaded, setLoaded] = useState(isCreate);
    const [saving, setSaving] = useState<'save' | 'submit' | null>(null);
    const [error, setError] = useState('');
    const [visible, setVisible] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        const frame = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    const handleClose = useCallback(() => {
        setVisible(false);
        setTimeout(onClose, 300);
    }, [onClose]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [handleClose]);

    useEffect(() => {
        if (applicationId === null) return;
        api(`/api/applications/${applicationId}`)
            .then(async (res) => {
                const body = await res.json();
                if (res.ok && body.application) {
                    setData(applicationToFormData(body.application));
                } else {
                    setError(body.message ?? 'Could not load this application.');
                }
                setLoaded(true);
            })
            .catch(() => {
                setError('Could not load this application.');
                setLoaded(true);
            });
    }, [applicationId]);

    const updateOrganization = (patch: Partial<OrganizationData>) =>
        setData((d) => ({ ...d, organization: { ...d.organization, ...patch } }));
    const updateProject = (patch: Partial<ProjectData>) =>
        setData((d) => ({ ...d, project: { ...d.project, ...patch } }));

    const handleAction = async (action: 'save' | 'submit') => {
        if (!formRef.current?.reportValidity()) return;
        setSaving(action);
        setError('');

        const payload = { ...buildApplyPayload(data, false), action };
        const res = await api(
            isCreate ? '/api/applications' : `/api/applications/${applicationId}`,
            { method: isCreate ? 'POST' : 'PATCH', body: JSON.stringify(payload) },
        );
        const body = await res.json();

        if (res.ok) {
            onSaved();
            handleClose();
        } else {
            const firstError = body.errors
                ? (Object.values(body.errors)[0] as string[])[0]
                : body.message;
            setError(firstError ?? 'Could not save. Please review your answers.');
            setSaving(null);
        }
    };

    return (
        <>
            <div
                className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
                    visible ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={handleClose}
            />

            <div
                className={`fixed right-0 top-0 z-50 flex h-full w-[90vw] flex-col border-l border-border-token bg-surface shadow-xl transition-transform duration-300 ease-out ${
                    visible ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex items-center justify-between border-b border-border-token p-4">
                    <h2 className="text-lg font-bold text-text-primary">
                        {isCreate ? 'New Application' : 'Edit Application'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="cursor-pointer text-xl text-text-muted hover:text-text-primary"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {!loaded ? (
                        <Spinner label="Loading application..." />
                    ) : (
                        <form ref={formRef} className="mx-auto max-w-3xl space-y-8">
                            {error && (
                                <div className="rounded bg-danger-bg p-3 text-sm text-danger-text">
                                    {error}
                                </div>
                            )}

                            <section>
                                <h3 className="mb-4 text-lg font-semibold text-text-primary">
                                    About Organization
                                </h3>
                                <AboutOrganizationStep
                                    value={data.organization}
                                    onChange={updateOrganization}
                                />
                            </section>

                            <section>
                                <h3 className="mb-4 text-lg font-semibold text-text-primary">
                                    Project Details
                                </h3>
                                <ProjectDetailsStep value={data.project} onChange={updateProject} />
                            </section>
                        </form>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-border-token p-4">
                    <button
                        onClick={handleClose}
                        className="cursor-pointer rounded border border-border-token bg-surface px-4 py-2 text-sm text-text-primary hover:bg-surface-hover"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => handleAction('save')}
                        disabled={saving !== null || !loaded}
                        className="cursor-pointer rounded border border-primary bg-surface px-6 py-2 text-sm font-medium text-primary hover:bg-surface-hover disabled:opacity-50"
                    >
                        {saving === 'save' ? 'Saving...' : 'Save'}
                    </button>
                    <button
                        onClick={() => handleAction('submit')}
                        disabled={saving !== null || !loaded}
                        className="cursor-pointer rounded bg-primary px-6 py-2 text-sm font-medium text-primary-text hover:bg-primary-hover disabled:opacity-50"
                    >
                        {saving === 'submit' ? 'Submitting...' : 'Submit'}
                    </button>
                </div>
            </div>
        </>
    );
}
