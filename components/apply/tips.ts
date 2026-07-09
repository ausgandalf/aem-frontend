// Helper tips shown next to field labels in the Quick Apply form.
// Keep these applicant-facing: plain language, concrete about what to write.

export const PROJECT_TIPS: Record<string, string> = {
    currency: 'The currency your requested amount is expressed in.',
    requested_amount:
        'The total funding you are requesting from WRBLO for this project. Enter a number only.',
    project_location:
        'Where the project will be delivered — city/region and country. Be as specific as you can.',
    funding_status:
        'Have you secured any other funding for this project? List confirmed and pending sources with amounts, or state that this is your only funding request.',
    duration:
        'How long the project will run (e.g. "12 months"). Include a start and end date if known.',
    livelihood_opportunity:
        'How the project creates or improves livelihoods and income for the people it serves.',
};

export const PURPOSE_TIPS: Record<string, string> = {
    beneficiaries:
        'Who directly benefits from this project — approximate numbers, who they are, and how you identified them.',
    philanthropic_call:
        'The core need or injustice driving this project. Why does it matter, and why now?',
    measurable_impact:
        'The specific, quantifiable change you expect. Where possible give a baseline and a target (e.g. "household income up 30% within 18 months").',
    track_record:
        "Your organization's relevant experience and past results delivering similar work.",
    best_evidence:
        'Your single strongest piece of proof of impact — data, an independent evaluation, audited outcomes, or credible testimony.',
    monitoring_evaluation:
        'How you will track progress and measure results: the indicators you will use, your methods, and how often you will review.',
    exit:
        'How the benefits will be sustained after WRBLO funding ends — your exit or sustainability plan.',
    collaboration:
        'Partners, local stakeholders, or networks you will work with, and the role each plays.',
    org_development_ambition:
        "How this project supports your organization's growth and longer-term ambitions.",
};

export const ORG_FINANCIAL_TIPS: Record<string, string> = {
    currency: "The reporting currency for your organization's finances.",
    annual_income:
        "Your organization's total income for the most recent financial year. Enter a number only.",
    annual_expenditure:
        "Your organization's total spending for the most recent financial year. Enter a number only.",
    reserves_policy:
        'Your policy on holding financial reserves, and your current reserve level if known.',
};
