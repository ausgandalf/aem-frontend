'use client';

import LabelWithTip from './LabelWithTip';
import { ProjectData, ProjectDetailsData, CURRENCY_OPTIONS } from './types';
import { PROJECT_TIPS, PURPOSE_TIPS } from './tips';

interface Props {
    value: ProjectData;
    onChange: (patch: Partial<ProjectData>) => void;
}

export default function ProjectDetailsStep({ value, onChange }: Props) {
    const setDetail = (key: keyof ProjectDetailsData, v: string) =>
        onChange({ project_details: { ...value.project_details, [key]: v } });

    // Long-form textarea bound to a project_details subfield
    const detail = (key: keyof ProjectDetailsData, label: string, tip?: string) => (
        <div>
            <LabelWithTip label={label} required tip={tip} htmlFor={`proj-${key}`} />
            <textarea
                id={`proj-${key}`}
                rows={3}
                value={value.project_details[key]}
                onChange={(e) => setDetail(key, e.target.value)}
                required
                className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
            />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div>
                    <LabelWithTip label="Project title" required htmlFor="proj-title" />
                    <input
                        id="proj-title"
                        type="text"
                        value={value.project_title}
                        onChange={(e) => onChange({ project_title: e.target.value })}
                        required
                        className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                        <LabelWithTip label="Currency" tip={PROJECT_TIPS.currency} htmlFor="proj-currency" />
                        <select
                            id="proj-currency"
                            value={value.currency}
                            onChange={(e) => onChange({ currency: e.target.value })}
                            className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                        >
                            {CURRENCY_OPTIONS.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="sm:col-span-2">
                        <LabelWithTip
                            label="Amount of funding requested"
                            required
                            tip={PROJECT_TIPS.requested_amount}
                            htmlFor="proj-amount"
                        />
                        <input
                            id="proj-amount"
                            type="number"
                            min="0"
                            value={value.requested_amount}
                            onChange={(e) => onChange({ requested_amount: e.target.value })}
                            required
                            className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                        />
                    </div>
                </div>

                <div>
                    <LabelWithTip
                        label="Project location"
                        required
                        tip={PROJECT_TIPS.project_location}
                        htmlFor="proj-location"
                    />
                    <input
                        id="proj-location"
                        type="text"
                        value={value.project_location}
                        onChange={(e) => onChange({ project_location: e.target.value })}
                        required
                        className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                    />
                </div>

                {detail('funding_status', 'Funding status', PROJECT_TIPS.funding_status)}
                {detail('duration', 'Duration', PROJECT_TIPS.duration)}
                {detail('livelihood_opportunity', 'Livelihood opportunity', PROJECT_TIPS.livelihood_opportunity)}
            </div>

            <div>
                <h3 className="mb-3 border-b border-border-token pb-1 text-sm font-semibold uppercase tracking-wide text-text-muted">
                    Purpose &amp; Aims
                </h3>
                <div className="space-y-4">
                    {detail('beneficiaries', 'Who are the beneficiaries?', PURPOSE_TIPS.beneficiaries)}
                    {detail('philanthropic_call', 'What is driving your philanthropic call?', PURPOSE_TIPS.philanthropic_call)}
                    {detail('measurable_impact', 'Measurable impact', PURPOSE_TIPS.measurable_impact)}
                </div>
            </div>

            <div>
                <h3 className="mb-3 border-b border-border-token pb-1 text-sm font-semibold uppercase tracking-wide text-text-muted">
                    Impact
                </h3>
                <div className="space-y-4">
                    {detail('track_record', 'Track record', PURPOSE_TIPS.track_record)}
                    {detail('best_evidence', 'Best evidence', PURPOSE_TIPS.best_evidence)}
                    {detail('monitoring_evaluation', 'Monitoring & Evaluation (M&E)', PURPOSE_TIPS.monitoring_evaluation)}
                    {detail('exit', 'Exit', PURPOSE_TIPS.exit)}
                    {detail('collaboration', 'Collaboration', PURPOSE_TIPS.collaboration)}
                    {detail('org_development_ambition', 'Organisation development and ambition', PURPOSE_TIPS.org_development_ambition)}
                </div>
            </div>
        </div>
    );
}
