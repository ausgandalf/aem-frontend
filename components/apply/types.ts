import { AddressValue, emptyAddress } from './AddressFields';

export const CONTACT_OPTIONS: { value: string; label: string }[] = [
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'SMS' },
    { value: 'scheduled_call', label: 'Scheduled call' },
];

export const CURRENCY_OPTIONS = ['GBP', 'USD', 'EUR', 'NGN', 'KES', 'ZAR'];

export interface ApplicantData {
    first_name: string;
    middle_name: string;
    last_name: string;
    email: string;
    phone: string;
    preferred_contact: string[];
    referred_from: string;
    position: string;
}

export interface OrganizationData {
    organization_id: number | null;
    label: string; // combobox display text for the selected org
    // Fields used only when registering a NEW organization:
    name: string;
    registration_number: string;
    legal_status: string;
    type: string;
    founded_year: string;
    address: AddressValue;
    contact_email: string;
    contact_phone: string;
    website_url: string;
    currency: string;
    annual_income: string;
    annual_expenditure: string;
    reserves_policy: string;
}

export interface ProjectDetailsData {
    funding_status: string;
    duration: string;
    livelihood_opportunity: string;
    beneficiaries: string;
    philanthropic_call: string;
    measurable_impact: string;
    track_record: string;
    best_evidence: string;
    monitoring_evaluation: string;
    exit: string;
    collaboration: string;
    org_development_ambition: string;
}

export interface ProjectData {
    project_title: string;
    currency: string;
    requested_amount: string;
    project_location: string;
    project_details: ProjectDetailsData;
}

export interface ApplyFormData {
    applicant: ApplicantData;
    organization: OrganizationData;
    project: ProjectData;
}

export const initialApplyData: ApplyFormData = {
    applicant: {
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        phone: '',
        preferred_contact: [],
        referred_from: '',
        position: '',
    },
    organization: {
        organization_id: null,
        label: '',
        name: '',
        registration_number: '',
        legal_status: '',
        type: '',
        founded_year: '',
        address: { ...emptyAddress },
        contact_email: '',
        contact_phone: '',
        website_url: '',
        currency: 'GBP',
        annual_income: '',
        annual_expenditure: '',
        reserves_policy: '',
    },
    project: {
        project_title: '',
        currency: 'GBP',
        requested_amount: '',
        project_location: '',
        project_details: {
            funding_status: '',
            duration: '',
            livelihood_opportunity: '',
            beneficiaries: '',
            philanthropic_call: '',
            measurable_impact: '',
            track_record: '',
            best_evidence: '',
            monitoring_evaluation: '',
            exit: '',
            collaboration: '',
            org_development_ambition: '',
        },
    },
};

// ── Applicant dashboard shapes ──────────────────────────────

export interface ApplicationCard {
    id: number;
    project_title: string;
    requested_amount: string | null;
    currency: string;
    current_stage: string | null;
    current_status: string;
    prev_stage: string | null;
    prev_status: string | null;
    created_at: string;
}

export interface ProgressStage {
    key: string;
    label: string;
    order: number;
    status: string | null;
    note: string | null;
}

export interface ApplicationDetail {
    id: number;
    project_title: string;
    project_location: string | null;
    requested_amount: string | null;
    currency: string;
    project_details: Partial<ProjectDetailsData> | null;
    organization_id: number | null;
    organization: { id: number; name: string } | null;
    current_stage: string | null;
    current_status: string;
}

// Map a loaded application into the org+project form shape for editing.
export function applicationToFormData(app: ApplicationDetail): ApplyFormData {
    return {
        applicant: initialApplyData.applicant, // unused in authenticated mode
        organization: {
            ...initialApplyData.organization,
            organization_id: app.organization_id,
            label: app.organization?.name ?? '',
        },
        project: {
            project_title: app.project_title ?? '',
            currency: app.currency ?? 'GBP',
            requested_amount: app.requested_amount != null ? String(app.requested_amount) : '',
            project_location: app.project_location ?? '',
            project_details: {
                ...initialApplyData.project.project_details,
                ...(app.project_details ?? {}),
            },
        },
    };
}

// Build the POST /api/apply payload from the form state.
// Only sends the org register fields when no existing org was selected.
export function buildApplyPayload(data: ApplyFormData, includeApplicant: boolean) {
    const org = data.organization;
    const organization = org.organization_id
        ? { organization_id: org.organization_id }
        : {
              name: org.name,
              registration_number: org.registration_number,
              legal_status: org.legal_status,
              type: org.type,
              founded_year: org.founded_year,
              registered_country: org.address.country,
              registered_state_province: org.address.state_province,
              registered_city: org.address.city,
              registered_address_line1: org.address.address_line1,
              registered_address_line2: org.address.address_line2,
              registered_postal_code: org.address.postal_code,
              contact_email: org.contact_email,
              contact_phone: org.contact_phone,
              website_url: org.website_url,
              currency: org.currency,
              annual_income: org.annual_income,
              annual_expenditure: org.annual_expenditure,
              reserves_policy: org.reserves_policy,
          };

    return {
        ...(includeApplicant ? { applicant: data.applicant } : {}),
        organization,
        project: {
            project_title: data.project.project_title,
            currency: data.project.currency,
            requested_amount: data.project.requested_amount,
            project_location: data.project.project_location,
            project_details: data.project.project_details,
        },
    };
}
