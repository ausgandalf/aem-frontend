export interface ProcessDoc {
    id: number;
    description: string | null;
    flag: string;
    flag_note: string | null;
    created_at: string;
    submitted_by: string | null;
    file: {
        original_name: string;
        mime_type: string | null;
        size: number;
        extension: string | null;
        about: string | null;
        tags: string | null;
    };
    view_url: string | null;
    can_delete: boolean;
}

export interface ProcessInspection {
    id: number;
    sector_key: string;
    sector_label: string | null;
    sector_description: string | null;
    sector_section: string | null;
    sector_order: number | null;
    status: string | null;
    note: string | null;
    documents: ProcessDoc[];
    documents_count: number;
}

export interface ProcessData {
    stage: { key: string; label: string };
    read_only: boolean;
    application: { id: number; project_title: string };
    inspections: ProcessInspection[];
}
