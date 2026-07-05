'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        const result = await login(email, password);

        if (result.ok) {
            router.push('/dashboard');
        } else {
            setError(result.message ?? 'Login failed');
            setSubmitting(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md space-y-4 rounded-lg bg-white p-8 shadow"
            >
                <h1 className="text-2xl font-bold text-gray-800">Sign in to AEM</h1>

                {error && (
                    <div className="rounded bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Password
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    />
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    {submitting ? 'Signing in...' : 'Sign in'}
                </button>
            </form>
        </main>
    );
}