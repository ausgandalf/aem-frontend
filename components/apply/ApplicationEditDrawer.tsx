'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import Spinner from '@/components/Spinner';
import AboutOrganizationStep from './AboutOrganizationStep';
import ProjectDetailsStep from './ProjectDetailsStep';
import DocumentsPanel from './DocumentsPanel';
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

type Tab = 'organization' | 'project' | 'documents';

export default function ApplicationEditDrawer({ applicationId, onClose, onSaved }: Props) {
    // Held in state so a create-mode Save can transition the drawer into
    // edit mode in place (drawer stays open, documents become attachable).
    const [appId, setAppId] = useState<number | null>(applicationId);
    const isCreate = appId === null;

    const [tab, setTab] = useState<Tab>('organization');
    const [data, setData] = useState<ApplyFormData>(initialApplyData);
    const [loaded, setLoaded] = useState(applicationId === null);
    const [saving, setSaving] = useState<'save' | 'submit' | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [docCount, setDocCount] = useState(0);
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
        if (appId === null) return;
        api(`/api/applications/${appId}`)
            .then(async (res) => {
                const body = await res.json();
                if (res.ok && body.application) {
                    setData(applicationToFormData(body.application));
                    setDocCount(body.application.documents_count ?? 0);
                } else {
                    setError(body.message ?? 'Could not load this application.');
                }
                setLoaded(true);
            })
            .catch(() => {
                setError('Could not load this application.');
                setLoaded(true);
            });
    }, [appId]);

    const updateOrganization = (patch: Partial<OrganizationData>) =>
        setData((d) => ({ ...d, organization: { ...d.organization, ...patch } }));
    const updateProject = (patch: Partial<ProjectData>) =>
        setData((d) => ({ ...d, project: { ...d.project, ...patch } }));

    const handleAction = async (action: 'save' | 'submit') => {
        // Validate the fields on the currently visible tab (native).
        if ((tab === 'organization' || tab === 'project') && !formRef.current?.reportValidity()) {
            return;
        }

        // Submitting with no supporting documents deserves a second thought.
        if (
            action === 'submit' &&
            docCount === 0 &&
            !confirm(
                'You did not include any supporting documents. Are you sure you want to submit without them?',
            )
        ) {
            return;
        }

        setSaving(action);
        setError('');
        setSuccess('');

        const payload = { ...buildApplyPayload(data, false), action };
        const res = await api(isCreate ? '/api/applications' : `/api/applications/${appId}`, {
            method: isCreate ? 'POST' : 'PATCH',
            body: JSON.stringify(payload),
        });
        const body = await res.json();

        if (res.ok) {
            onSaved(); // refresh the card list behind the drawer

            if (action === 'submit') {
                handleClose();
                return;
            }

            // Save keeps the drawer open; a new application becomes editable in place
            if (isCreate && body.application_id) {
                setAppId(body.application_id);
                setSuccess('Application saved. You can now attach documents in the Documents tab.');
            } else {
                setSuccess('Application saved.');
            }
            setSaving(null);
            return;
        }

        // On validation failure, jump to the tab that owns the first bad field.
        const firstKey = body.errors ? Object.keys(body.errors)[0] : '';
        if (firstKey.startsWith('organization')) setTab('organization');
        else if (firstKey.startsWith('project')) setTab('project');

        const firstError = body.errors
            ? (Object.values(body.errors)[0] as string[])[0]
            : body.message;
        setError(firstError ?? 'Could not save. Please review your answers.');
        setSaving(null);
    };

    const tabs: { key: Tab; label: string }[] = [
        { key: 'organization', label: 'Organization' },
        { key: 'project', label: 'Project Details' },
        { key: 'documents', label: `Documents (${docCount})` },
    ];

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
                        aria-label="Close"
                        className="cursor-pointer text-xl text-text-muted hover:text-text-primary"
                    >
                        ✕
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border-token">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`cursor-pointer px-6 py-3 text-sm font-medium ${
                                tab === t.key
                                    ? 'border-b-2 border-primary text-primary'
                                    : 'text-text-secondary hover:text-text-primary'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {!loaded ? (
                        <Spinner label="Loading application..." />
                    ) : (
                        <div className="">
                            {error && (
                                <div className="mb-6 rounded bg-danger-bg p-3 text-sm text-danger-text">
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="mb-6 rounded bg-success-bg p-3 text-sm text-success-text">
                                    {success}
                                </div>
                            )}

                            {/* Only the active tab renders: native validation covers it, and the
                                backend catches cross-tab gaps (we auto-switch to the bad tab on 422). */}
                            <form ref={formRef}>
                                {tab === 'organization' && (
                                    <AboutOrganizationStep
                                        value={data.organization}
                                        onChange={updateOrganization}
                                    />
                                )}
                                {tab === 'project' && (
                                    <ProjectDetailsStep value={data.project} onChange={updateProject} />
                                )}
                            </form>

                            {tab === 'documents' &&
                                (appId !== null ? (
                                    <DocumentsPanel applicationId={appId} onCountChange={setDocCount} />
                                ) : (
                                    <div className="rounded-lg border border-dashed border-border-token p-10 text-center text-text-muted">
                                        Documents can be attached once the application has been created.
                                        <br />
                                        Click{' '}
                                        <span className="font-medium text-text-primary">Save</span> below
                                        to create it as a draft first — the drawer will stay open and you
                                        can attach files right here.
                                    </div>
                                ))}
                        </div>
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
