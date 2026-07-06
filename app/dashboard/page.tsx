'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';
import Link from 'next/link';

export default function DashboardPage() {
    const router = useRouter();
    const { user, roles, loading, logout } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) return <div className="p-8 text-text-secondary">Loading...</div>;
    if (!user) return null;

    return (
        <main className="min-h-screen bg-background p-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-text-primary">
                    Welcome, {user.first_name} {user.last_name}
                </h1>
                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <button
                        onClick={async () => {
                            await logout();
                            router.push('/login');
                        }}
                        className="rounded bg-surface border border-border-token px-4 py-2 text-text-primary hover:bg-surface-hover"
                    >
                        Logout
                    </button>
                </div>
            </div>

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
                            className="mt-6 inline-block rounded bg-primary px-4 py-2 text-primary-text hover:bg-primary-hover"
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
        </main>
    );
}