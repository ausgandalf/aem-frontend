'use client';

import { useEffect, useState } from 'react';
import { ApplicationDetail, ProjectDetailsData } from './types';
import DocumentsPanel from './DocumentsPanel';

type SectionKey = 'applicant' | 'organization' | 'project' | 'documents';

const CONTACT_LABELS: Record<string, string> = {
    email: 'Email',
    sms: 'SMS',
    scheduled_call: 'Scheduled call',
};

const PROJECT_DETAIL_FIELDS: [keyof ProjectDetailsData, string][] = [
    ['funding_status', 'Funding status'],
    ['duration', 'Duration'],
    ['livelihood_opportunity', 'Livelihood opportunity'],
    ['beneficiaries', 'Who are the beneficiaries?'],
    ['philanthropic_call', 'What is driving your philanthropic call?'],
    ['measurable_impact', 'Measurable impact'],
    ['track_record', 'Track record'],
    ['best_evidence', 'Best evidence'],
    ['monitoring_evaluation', 'Monitoring & Evaluation (M&E)'],
    ['exit', 'Exit'],
    ['collaboration', 'Collaboration'],
    ['org_development_ambition', 'Organisation development and ambition'],
];

const val = (v: string | number | null | undefined) =>
    v === null || v === undefined || `${v}`.trim() === '' ? '—' : `${v}`;

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="py-1.5">
            <dt className="text-xs text-text-muted">{label}</dt>
            <dd className="whitespace-pre-wrap text-sm text-text-primary">{value}</dd>
        </div>
    );
}

function Accordion({
    title,
    open,
    onToggle,
    children,
}: {
    title: string;
    open: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    // Mount the body once it's first opened, then keep it mounted so both the
    // expand AND collapse animations have content to animate (and lazy children
    // like the documents list still don't fetch until first opened).
    const [everOpened, setEverOpened] = useState(open);
    useEffect(() => {
        if (open) setEverOpened(true);
    }, [open]);

    return (
        <div className="overflow-hidden rounded-lg border border-border-token">
            <button
                onClick={onToggle}
                className="flex w-full cursor-pointer items-center justify-between bg-surface-dark px-4 py-3 text-left text-sm font-semibold text-text-primary hover:bg-surface-hover"
            >
                {title}
                <span className={`text-text-muted transition-transform duration-300 ${open ? 'rotate-90' : ''}`}>
                    ›
                </span>
            </button>
            {/* grid-rows 0fr→1fr animates height:auto smoothly */}
            <div
                className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                    open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}
            >
                <div className="overflow-hidden">
                    <div className="border-t border-border-token px-4 py-2">
                        {everOpened ? children : null}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ApplicationDetailsPanel({ application }: { application: ApplicationDetail }) {
    const a = application.applicant;
    const o = application.organization;
    const pd = application.project_details ?? {};

    // Header count starts from the total, then corrects to the visible (permission-
    // filtered) count once the documents accordion loads its list.
    const [docCount, setDocCount] = useState(application.documents_count ?? 0);

    // Single-open accordion group (Project Details open by default)
    const [openKey, setOpenKey] = useState<SectionKey | null>('project');
    const toggle = (k: SectionKey) => setOpenKey((cur) => (cur === k ? null : k));

    const fullName = a
        ? [a.first_name, a.middle_name, a.last_name].filter(Boolean).join(' ')
        : '—';

    const address = o
        ? [
              o.registered_address_line1,
              o.registered_address_line2,
              o.registered_city,
              o.registered_state_province,
              o.registered_postal_code,
              o.registered_country,
          ]
              .filter(Boolean)
              .join(', ')
        : '';

    return (
        <div className="space-y-3">
            <Accordion
                title="Applicant"
                open={openKey === 'applicant'}
                onToggle={() => toggle('applicant')}
            >
                {a ? (
                    <dl>
                        <Row label="Name" value={fullName} />
                        <Row label="Email" value={val(a.email)} />
                        <Row label="Phone" value={val(a.phone)} />
                        <Row label="Position" value={val(a.position)} />
                        <Row
                            label="Preferred contact"
                            value={
                                a.preferred_contact && a.preferred_contact.length > 0
                                    ? a.preferred_contact.map((c) => CONTACT_LABELS[c] ?? c).join(', ')
                                    : '—'
                            }
                        />
                    </dl>
                ) : (
                    <p className="py-2 text-sm text-text-muted">No applicant information.</p>
                )}
            </Accordion>

            <Accordion
                title="Organization"
                open={openKey === 'organization'}
                onToggle={() => toggle('organization')}
            >
                {o ? (
                    <dl>
                        <Row label="Name" value={val(o.name)} />
                        <Row label="Type" value={val(o.type)} />
                        <Row label="Registration number" value={val(o.registration_number)} />
                        <Row label="Legal status" value={val(o.legal_status)} />
                        <Row label="Founded year" value={val(o.founded_year)} />
                        <Row label="Address" value={address || '—'} />
                        <Row label="Contact email" value={val(o.contact_email)} />
                        <Row label="Contact phone" value={val(o.contact_phone)} />
                        <Row
                            label="Website"
                            value={
                                o.website_url ? (
                                    <a
                                        href={o.website_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        {o.website_url}
                                    </a>
                                ) : (
                                    '—'
                                )
                            }
                        />
                        <Row
                            label="Annual income"
                            value={o.annual_income != null ? `${o.currency ?? ''} ${o.annual_income}`.trim() : '—'}
                        />
                        <Row
                            label="Annual expenditure"
                            value={
                                o.annual_expenditure != null
                                    ? `${o.currency ?? ''} ${o.annual_expenditure}`.trim()
                                    : '—'
                            }
                        />
                        <Row label="Reserves policy" value={val(o.reserves_policy)} />
                    </dl>
                ) : (
                    <p className="py-2 text-sm text-text-muted">No organization information.</p>
                )}
            </Accordion>

            <Accordion
                title="Project Details"
                open={openKey === 'project'}
                onToggle={() => toggle('project')}
            >
                <dl>
                    <Row label="Project title" value={val(application.project_title)} />
                    <Row label="Location" value={val(application.project_location)} />
                    <Row
                        label="Requested amount"
                        value={
                            application.requested_amount != null
                                ? `${application.currency} ${Number(application.requested_amount).toLocaleString()}`
                                : '—'
                        }
                    />
                    {PROJECT_DETAIL_FIELDS.map(([key, label]) => (
                        <Row key={key} label={label} value={val(pd[key])} />
                    ))}
                </dl>
            </Accordion>

            <Accordion
                title={`Documents (${docCount})`}
                open={openKey === 'documents'}
                onToggle={() => toggle('documents')}
            >
                <div className="py-2">
                    <DocumentsPanel
                        applicationId={application.id}
                        readOnly
                        onCountChange={setDocCount}
                    />
                </div>
            </Accordion>
        </div>
    );
}
