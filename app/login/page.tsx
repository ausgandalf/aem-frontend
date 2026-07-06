'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';

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
        <main className="flex min-h-screen items-center justify-center bg-background">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md space-y-4 rounded-lg bg-surface border border-border-token p-8 shadow-sm"
            >
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-text-primary">Sign in to AEM</h1>
                    <ThemeToggle />
                </div>

                {error && (
                    <div className="rounded bg-danger-bg p-3 text-sm text-danger-text">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-text-secondary">
                        Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-secondary">
                        Password
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                    />
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded bg-primary py-2 font-medium text-primary-text hover:bg-primary-hover disabled:opacity-50"
                >
                    {submitting ? 'Signing in...' : 'Sign in'}
                </button>
            </form>
        </main>
    );
}