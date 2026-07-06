'use client';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function DashboardPage() {
    // AppShell already guards auth + loading, so `user` is guaranteed here
    const { user, roles } = useAuth();
    if (!user) return null;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-text-primary">
                Welcome, {user.first_name} {user.last_name}
            </h1>

            <div className="mt-6 rounded-lg bg-surface border border-border-token p-6 shadow-sm">
                <div className="space-y-2 text-text-primary">
                    <p>
                        <span className="text-text-secondary">Email:</span> {user.email}
                    </p>
                    <p>
                        <span className="text-text-secondary">Role:</span> {roles.join(', ')}
                    </p>
                    <p>
                        <span className="text-text-secondary">Status:</span> {user.status}
                    </p>
                </div>

                {roles.includes('admin') && (
                    <div className="mt-6 flex gap-3">
                        <Link
                            href="/admin/users"
                            className="inline-block rounded bg-primary px-4 py-2 text-primary-text hover:bg-primary-hover"
                        >
                            Manage Users
                        </Link>
                        <Link
                            href="/admin/organizations"
                            className="rounded bg-primary px-4 py-2 text-primary-text hover:bg-primary-hover"
                        >
                            Manage Organizations
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
