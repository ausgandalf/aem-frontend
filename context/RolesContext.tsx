'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';

export interface Role {
    name: string;
    label: string;
}

interface RolesContextType {
    roles: Role[];
    loading: boolean;
    getLabel: (name: string) => string;
}

const RolesContext = createContext<RolesContextType | null>(null);

export function RolesProvider({ children }: { children: ReactNode }) {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api('/api/roles')
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => setRoles(data))
            .catch(() => setRoles([]))
            .finally(() => setLoading(false));
    }, []);

    // Translate a role name to its label, fallback to raw name
    const getLabel = (name: string) =>
        roles.find((r) => r.name === name)?.label ?? name;

    return (
        <RolesContext.Provider value={{ roles, loading, getLabel }}>
            {children}
        </RolesContext.Provider>
    );
}

export function useRoles() {
    const ctx = useContext(RolesContext);
    if (!ctx) throw new Error('useRoles must be used inside RolesProvider');
    return ctx;
}