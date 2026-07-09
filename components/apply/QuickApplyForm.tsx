'use client';

import { useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';
import AboutYouStep from './AboutYouStep';
import AboutOrganizationStep from './AboutOrganizationStep';
import ProjectDetailsStep from './ProjectDetailsStep';
import {
    ApplyFormData,
    ApplicantData,
    OrganizationData,
    ProjectData,
    initialApplyData,
    buildApplyPayload,
} from './types';

interface Props {
    // Hide the About You step when an authenticated user submits (default: public form)
    includeAboutYou?: boolean;
    endpoint?: string;
    onSuccess?: (applicationId: number) => void;
}

export default function QuickApplyForm({
    includeAboutYou = true,
    endpoint = '/api/apply',
    onSuccess,
}: Props) {
    const [data, setData] = useState<ApplyFormData>(initialApplyData);
    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const updateApplicant = (patch: Partial<ApplicantData>) =>
        setData((d) => ({ ...d, applicant: { ...d.applicant, ...patch } }));
    const updateOrganization = (patch: Partial<OrganizationData>) =>
        setData((d) => ({ ...d, organization: { ...d.organization, ...patch } }));
    const updateProject = (patch: Partial<ProjectData>) =>
        setData((d) => ({ ...d, project: { ...d.project, ...patch } }));

    const steps = useMemo(() => {
        const s: { key: string; title: string; node: React.ReactNode }[] = [];
        if (includeAboutYou) {
            s.push({
                key: 'you',
                title: 'About You',
                node: <AboutYouStep value={data.applicant} onChange={updateApplicant} />,
            });
        }
        s.push({
            key: 'org',
            title: 'About Organization',
            node: <AboutOrganizationStep value={data.organization} onChange={updateOrganization} />,
        });
        s.push({
            key: 'project',
            title: 'Project Details',
            node: <ProjectDetailsStep value={data.project} onChange={updateProject} />,
        });
        return s;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, includeAboutYou]);

    const isLast = step === steps.length - 1;
    const currentKey = steps[step].key;

    // Validate the currently visible step (native required + a manual check or two)
    const validateCurrent = (): boolean => {
        if (!formRef.current?.reportValidity()) return false;

        if (currentKey === 'you' && data.applicant.preferred_contact.length === 0) {
            setError('Please select at least one preferred contact method.');
            return false;
        }
        setError('');
        return true;
    };

    const goNext = () => {
        if (validateCurrent()) setStep((s) => Math.min(s + 1, steps.length - 1));
    };
    const goBack = () => {
        setError('');
        setStep((s) => Math.max(s - 1, 0));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLast) {
            goNext();
            return;
        }
        if (!validateCurrent()) return;

        setSubmitting(true);
        setError('');

        const res = await api(endpoint, {
            method: 'POST',
            body: JSON.stringify(buildApplyPayload(data, includeAboutYou)),
        });
        const body = await res.json();

        if (res.ok) {
            setDone(true);
            onSuccess?.(body.application_id);
        } else {
            const firstError = body.errors
                ? (Object.values(body.errors)[0] as string[])[0]
                : body.message;
            setError(firstError ?? 'Submission failed. Please review your answers and try again.');
        }
        setSubmitting(false);
    };

    if (done) {
        return (
            <div className="rounded-lg border border-border-token bg-surface p-8 text-center shadow-sm">
                <h2 className="text-2xl font-bold text-text-primary">Application submitted</h2>
                <p className="mt-3 text-sm text-text-secondary">
                    Thank you. We&apos;ve received your application and sent a confirmation to your email.
                    {includeAboutYou &&
                        ' Please also click the verification link we sent to confirm your email address.'}
                </p>
            </div>
        );
    }

    return (
        <div>
            {/* Stepper */}
            <ol className="mb-8 flex items-center gap-2">
                {steps.map((s, i) => (
                    <li key={s.key} className="flex flex-1 items-center gap-2">
                        <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                                i === step
                                    ? 'bg-primary text-primary-text'
                                    : i < step
                                      ? 'bg-selected text-primary-text'
                                      : 'border border-border-token text-text-muted'
                            }`}
                        >
                            {i + 1}
                        </span>
                        <span
                            className={`hidden text-sm sm:block ${
                                i === step ? 'font-medium text-text-primary' : 'text-text-muted'
                            }`}
                        >
                            {s.title}
                        </span>
                        {i < steps.length - 1 && (
                            <span className="mx-1 hidden h-px flex-1 bg-border-token sm:block" />
                        )}
                    </li>
                ))}
            </ol>

            <form ref={formRef} onSubmit={handleSubmit} noValidate={false}>
                <h2 className="mb-4 text-xl font-bold text-text-primary">{steps[step].title}</h2>

                {error && (
                    <div className="mb-4 rounded bg-danger-bg p-3 text-sm text-danger-text">{error}</div>
                )}

                {steps[step].node}

                <div className="mt-8 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={goBack}
                        disabled={step === 0}
                        className="cursor-pointer rounded border border-border-token bg-surface px-4 py-2 text-sm text-text-primary hover:bg-surface-hover disabled:opacity-40"
                    >
                        Back
                    </button>

                    {isLast ? (
                        <button
                            type="submit"
                            disabled={submitting}
                            className="cursor-pointer rounded bg-primary px-6 py-2 text-sm font-medium text-primary-text hover:bg-primary-hover disabled:opacity-50"
                        >
                            {submitting ? 'Submitting...' : 'Submit application'}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={goNext}
                            className="cursor-pointer rounded bg-primary px-6 py-2 text-sm font-medium text-primary-text hover:bg-primary-hover"
                        >
                            Next
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
