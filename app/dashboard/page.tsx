'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
    const router = useRouter();
    const { user, roles, loading, logout } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) return <div className="p-8">Loading...</div>;
    if (!user) return null;

    return (
        <main className="p-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">
                    Welcome, {user.first_name} {user.last_name}
                </h1>
                <button
                    onClick={async () => {
                        await logout();
                        router.push('/login');
                    }}
                    className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
                >
                    Logout
                </button>
            </div>

            <div className="mt-4 rounded bg-white p-4 shadow">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {roles.join(', ')}</p>
                <p><strong>Status:</strong> {user.status}</p>
            </div>
        </main>
    );
}