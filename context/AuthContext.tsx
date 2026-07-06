'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
    id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    email: string;
    phone: string | null;
    role: string;
    status: string;
    preferred_contact: string[] | null;
}

interface AuthContextType {
    user: User | null;
    roles: string[];
    loading: boolean;
    login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [roles, setRoles] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const refresh = async () => {
        try {
            const res = await api('/api/me');
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                setRoles(data.roles);
            } else {
                setUser(null);
                setRoles([]);
            }
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    const login = async (email: string, password: string) => {
        const res = await api('/api/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (res.ok) {
            setUser(data.user);
            setRoles(data.roles);
            return { ok: true };
        }

        return { ok: false, message: data.message ?? 'Login failed' };
    };

    const logout = async () => {
        await api('/api/logout', { method: 'POST' });
        setUser(null);
        setRoles([]);
    };

    return (
        <AuthContext.Provider value={{ user, roles, loading, login, logout, refresh }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}