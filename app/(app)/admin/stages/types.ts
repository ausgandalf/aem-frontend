export interface Sector {
    id: number;
    key: string;
    label: string;
    description: string | null;
    stage_key: string;
    order: number;
}

export interface Stage {
    id: number;
    key: string;
    label: string;
    role: string;
    order: number;
    status: string;
    sectors: Sector[];
}

export interface RoleOption {
    name: string;
    label: string;
}
