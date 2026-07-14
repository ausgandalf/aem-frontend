'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useRoles } from '@/context/RolesContext';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import UserDrawer from './UserDrawer';
import OrganizationCombobox from '@/components/OrganizationCombobox';
import Spinner from '@/components/Spinner';

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    role: string;
    status: string;
    email_verified_at: string | null;
    organization: { id: number; name: string } | null;
    created_at: string;
}

interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

const STATUSES = ['pending', 'active', 'blocked'];

function UsersPageContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user, roles, loading: authLoading } = useAuth();
    const { roles: availableRoles, getLabel } = useRoles();
    const [users, setUsers] = useState<Paginated<User> | null>(null);
    const [loading, setLoading] = useState(true);
    // All filters/pagination initialize from the URL so the view is bookmarkable
    const [search, setSearch] = useState(searchParams.get('search') ?? '');
    const [roleFilter, setRoleFilter] = useState(searchParams.get('role') ?? '');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? '');
    const [organizationId, setOrganizationId] = useState<number | null>(
        searchParams.get('organization_id')
            ? Number(searchParams.get('organization_id'))
            : null
    );
    // Display name for the org filter; resolved from the id (see effect below)
    const [organizationLabel, setOrganizationLabel] = useState('');
    const [page, setPage] = useState(Number(searchParams.get('page') ?? '1'));
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
            } else if (!roles.includes('admin')) {
                router.push('/dashboard');
            }
        }
    }, [user, roles, authLoading, router]);

    // When the org filter comes from a bookmarked URL we only have the id;
    // fetch the name so the combobox can display it.
    useEffect(() => {
        if (organizationId && !organizationLabel) {
            api(`/api/admin/organizations/${organizationId}`)
                .then((res) => (res.ok ? res.json() : null))
                .then((data) => {
                    if (data?.organization) setOrganizationLabel(data.organization.name);
                });
        }
    }, [organizationId, organizationLabel]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);

        // Build query params from the current filters
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (roleFilter) params.set('role', roleFilter);
        if (statusFilter) params.set('status', statusFilter);
        if (organizationId) params.set('organization_id', String(organizationId));
        if (page > 1) params.set('page', String(page));

        // Reflect the current view in the URL (bookmarkable / shareable)
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });

        const res = await api(`/api/admin/users?${query}`);
        if (res.ok) {
            const data = await res.json();
            setUsers(data);
        }

        setLoading(false);
    }, [search, roleFilter, statusFilter, organizationId, page, pathname, router]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 300);

        return () => clearTimeout(timer);
    }, [fetchUsers]);

    const handleAction = async (userId: number, action: 'allow' | 'block') => {
        const res = await api(`/api/admin/users/${userId}/${action}`, {
            method: 'PATCH',
        });

        if (res.ok) {
            fetchUsers();
        } else {
            const data = await res.json();
            alert(data.message ?? 'Action failed');
        }
    };

    const handleToggleVerify = async (userId: number) => {
        const res = await api(`/api/admin/users/${userId}/verify-email`, {
            method: 'PATCH',
        });

        if (res.ok) {
            fetchUsers();
        } else {
            const data = await res.json();
            alert(data.message ?? 'Action failed');
        }
    };

    if (authLoading) {
        return <div className="p-8 text-text-secondary"><Spinner label="Loading..." /></div>;
    }

    return (
        <div className="p-8">
            <h1 className="mb-6 text-2xl font-bold text-text-primary">User Management</h1>

            <div className="mb-4 flex flex-wrap gap-3">
                <input
                    type="text"
                    placeholder="Search name, email, phone..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    className="w-72 rounded border border-border-token bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
                />
                <select
                    value={roleFilter}
                    onChange={(e) => {
                        setRoleFilter(e.target.value);
                        setPage(1);
                    }}
                    className="rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                >
                    <option value="">All roles</option>
                    {availableRoles.map((r) => (
                        <option key={r.name} value={r.name}>
                            {r.label}
                        </option>
                    ))}
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                    }}
                    className="rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                >
                    <option value="">All statuses</option>
                    {STATUSES.map((s) => (
                        <option key={s} value={s}>
                            {s}
                        </option>
                    ))}
                </select>
                <OrganizationCombobox
                    value={organizationId}
                    label={organizationLabel}
                    onChange={(id, label) => {
                        setOrganizationId(id);
                        setOrganizationLabel(label);
                        setPage(1);
                    }}
                />
            </div>

            <div className="overflow-x-auto rounded-lg border border-border-token bg-surface shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-border-token bg-surface-hover">
                        <tr className="text-text-secondary">
                            <th className="px-4 py-3 font-medium w-12">#</th>
                            <th className="px-4 py-3 font-medium">Name</th>
                            <th className="px-4 py-3 font-medium">Email</th>
                            <th className="px-4 py-3 font-medium">Role</th>
                            <th className="px-4 py-3 font-medium">Organization</th>
                            <th className="px-4 py-3 font-medium">Verified</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-text-muted">
                                    <Spinner label="Loading users..." />
                                </td>
                            </tr>
                        )}

                        {!loading && users && users.data.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-text-muted">
                                    No users found
                                </td>
                            </tr>
                        )}

                        {!loading &&
                            users &&
                            users.data.map((u, index) => (
                                <tr
                                    key={u.id}
                                    className="border-b border-border-token last:border-b-0 hover:bg-surface-hover"
                                >
                                    <td className="px-4 py-3 text-text-muted">
                                        {(users.current_page - 1) * users.per_page + index + 1}
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => setSelectedUserId(u.id)}
                                            className="cursor-pointer text-primary hover:underline"
                                        >
                                            {u.first_name} {u.last_name}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-text-primary">{u.email}</td>
                                    <td className="px-4 py-3 text-text-secondary">{getLabel(u.role)}</td>
                                    <td className="px-4 py-3 text-text-secondary">{u.organization?.name ?? '—'}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col items-start gap-1">
                                            <span
                                                className={`rounded px-2 py-1 text-xs font-medium ${
                                                    u.email_verified_at
                                                        ? 'bg-success-bg text-success-text'
                                                        : 'bg-surface-hover text-text-muted'
                                                }`}
                                            >
                                                {u.email_verified_at ? 'Verified' : 'Unverified'}
                                            </span>
                                            <button
                                                onClick={() => handleToggleVerify(u.id)}
                                                className="cursor-pointer text-xs text-primary hover:underline"
                                            >
                                                {u.email_verified_at ? 'Unverify' : 'Verify'}
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`rounded px-2 py-1 text-xs font-medium ${
                                                u.status === 'active'
                                                    ? 'bg-success-bg text-success-text'
                                                    : u.status === 'pending'
                                                      ? 'bg-warning-bg text-warning-text'
                                                      : 'bg-danger-bg text-danger-text'
                                            }`}
                                        >
                                            {u.status}
                                        </span>
                                    </td>
                                    <td className="space-x-2 px-4 py-3">
                                        {u.status !== 'active' && (
                                            <button
                                                onClick={() => handleAction(u.id, 'allow')}
                                                className="cursor-pointer rounded bg-success px-3 py-1 text-xs text-white hover:bg-success-hover"
                                            >
                                                Allow
                                            </button>
                                        )}
                                        {u.status !== 'blocked' && (
                                            <button
                                                onClick={() => handleAction(u.id, 'block')}
                                                className="cursor-pointer rounded bg-danger px-3 py-1 text-xs text-white hover:bg-danger-hover"
                                            >
                                                Block
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            {users && users.last_page > 1 && (
                <div className="mt-4 flex items-center gap-3">
                    <button
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="rounded border border-border-token bg-surface px-3 py-1 text-text-primary hover:bg-surface-hover disabled:opacity-40"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-text-secondary">
                        Page {users.current_page} of {users.last_page} ({users.total} users)
                    </span>
                    <button
                        disabled={page >= users.last_page}
                        onClick={() => setPage((p) => p + 1)}
                        className="rounded border border-border-token bg-surface px-3 py-1 text-text-primary hover:bg-surface-hover disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            )}

            {selectedUserId !== null && (
                <UserDrawer
                    userId={selectedUserId}
                    onClose={() => setSelectedUserId(null)}
                    onChanged={fetchUsers}
                />
            )}
        </div>
    );
}

// useSearchParams() must be read inside a Suspense boundary in the App Router
export default function UsersPage() {
    return (
        <Suspense fallback={<div className="p-8 text-text-secondary">Loading...</div>}>
            <UsersPageContent />
        </Suspense>
    );
}