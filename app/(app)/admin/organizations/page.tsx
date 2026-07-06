'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import Spinner from '@/components/Spinner';
import OrganizationDrawer from './OrganizationDrawer';

export interface Organization {
    id: number;
    name: string;
    country: string;
    type: string | null;
    note: string | null;
    legal_status: string | null;
    register_no: string | null;
    users_count: number;
    created_at: string;
}

interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

function OrganizationsPageContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user, roles, loading: authLoading } = useAuth();

    const [orgs, setOrgs] = useState<Paginated<Organization> | null>(null);
    const [loading, setLoading] = useState(true);
    // Search + pagination initialize from the URL so the view is bookmarkable
    const [search, setSearch] = useState(searchParams.get('search') ?? '');
    const [page, setPage] = useState(Number(searchParams.get('page') ?? '1'));
    const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
            } else if (!roles.includes('admin')) {
                router.push('/dashboard');
            }
        }
    }, [user, roles, authLoading, router]);

    const fetchOrgs = useCallback(async () => {
        setLoading(true);

        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (page > 1) params.set('page', String(page));

        // Reflect the current view in the URL (bookmarkable / shareable)
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });

        const res = await api(`/api/admin/organizations?${params.toString()}`);
        if (res.ok) {
            setOrgs(await res.json());
        }

        setLoading(false);
    }, [search, page, pathname, router]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchOrgs();
        }, 300);

        return () => clearTimeout(timer);
    }, [fetchOrgs]);

    const handleDelete = async (orgId: number) => {
        if (!confirm('Delete this organization?')) return;

        const res = await api(`/api/admin/organizations/${orgId}`, {
            method: 'DELETE',
        });

        if (res.ok) {
            fetchOrgs();
        } else {
            const data = await res.json();
            alert(data.message ?? 'Delete failed');
        }
    };

    if (authLoading) {
        return <div className="p-8 text-text-secondary">Loading...</div>;
    }

    return (
        <div className="p-8">
            <h1 className="mb-6 text-2xl font-bold text-text-primary">
                Organization Management
            </h1>

            <div className="mb-4 flex flex-wrap items-center gap-3">
                <input
                    type="text"
                    placeholder="Search name, register no, type..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    className="w-72 rounded border border-border-token bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
                />
                <button
                    onClick={() => setCreating(true)}
                    className="cursor-pointer rounded bg-primary px-4 py-2 text-sm font-medium text-primary-text hover:bg-primary-hover"
                >
                    + New Organization
                </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border-token bg-surface shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-border-token bg-surface-hover">
                        <tr className="text-text-secondary">
                            <th className="w-12 px-4 py-3 font-medium">#</th>
                            <th className="px-4 py-3 font-medium">Name</th>
                            <th className="px-4 py-3 font-medium">Country</th>
                            <th className="px-4 py-3 font-medium">Type</th>
                            <th className="px-4 py-3 font-medium">Register No</th>
                            <th className="px-4 py-3 font-medium">Users</th>
                            <th className="px-4 py-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td colSpan={7}>
                                    <Spinner label="Loading organizations..." />
                                </td>
                            </tr>
                        )}

                        {!loading && orgs && orgs.data.length === 0 && (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-4 py-8 text-center text-text-muted"
                                >
                                    No organizations found
                                </td>
                            </tr>
                        )}

                        {!loading &&
                            orgs &&
                            orgs.data.map((org, index) => (
                                <tr
                                    key={org.id}
                                    className="border-b border-border-token last:border-b-0 hover:bg-surface-hover"
                                >
                                    <td className="px-4 py-3 text-text-muted">
                                        {(orgs.current_page - 1) * orgs.per_page + index + 1}
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => setSelectedOrgId(org.id)}
                                            className="cursor-pointer text-primary hover:underline"
                                        >
                                            {org.name}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-text-secondary">
                                        {org.country}
                                    </td>
                                    <td className="px-4 py-3 text-text-secondary">
                                        {org.type ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-text-secondary">
                                        {org.register_no ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-text-primary">
                                        <Link
                                            href={"/admin/users?organization_id=" + org.id}
                                            className="text-sm text-primary hover:underline"
                                            title={"Find users in " + org.name}
                                        >
                                            {org.users_count}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => handleDelete(org.id)}
                                            disabled={org.users_count > 0}
                                            title={
                                                org.users_count > 0
                                                    ? 'Cannot delete - has users assigned'
                                                    : 'Delete organization'
                                            }
                                            className="rounded bg-danger px-3 py-1 text-xs text-white hover:bg-danger-hover disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            {orgs && orgs.last_page > 1 && (
                <div className="mt-4 flex items-center gap-3">
                    <button
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="rounded border border-border-token bg-surface px-3 py-1 text-text-primary hover:bg-surface-hover disabled:opacity-40"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-text-secondary">
                        Page {orgs.current_page} of {orgs.last_page} ({orgs.total}{' '}
                        organizations)
                    </span>
                    <button
                        disabled={page >= orgs.last_page}
                        onClick={() => setPage((p) => p + 1)}
                        className="rounded border border-border-token bg-surface px-3 py-1 text-text-primary hover:bg-surface-hover disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            )}

            {(selectedOrgId !== null || creating) && (
                <OrganizationDrawer
                    orgId={selectedOrgId}
                    onClose={() => {
                        setSelectedOrgId(null);
                        setCreating(false);
                    }}
                    onChanged={fetchOrgs}
                />
            )}
        </div>
    );
}

// useSearchParams() must be read inside a Suspense boundary in the App Router
export default function OrganizationsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-text-secondary">Loading...</div>}>
            <OrganizationsPageContent />
        </Suspense>
    );
}