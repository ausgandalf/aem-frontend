'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');

        const res = await api('/api/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
        const data = await res.json();

        // Backend intentionally returns a generic message either way
        setMessage(data.message ?? 'If an account exists, a reset link has been sent.');
        setSubmitting(false);
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-background p-4">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md space-y-4 rounded-lg border border-border-token bg-surface p-8 shadow-sm"
            >
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-text-primary">Reset your password</h1>
                    <ThemeToggle />
                </div>

                <p className="text-sm text-text-secondary">
                    Enter your account email and we&apos;ll send you a link to reset your password.
                </p>

                {message && (
                    <div className="rounded bg-success-bg p-3 text-sm text-success-text">{message}</div>
                )}

                <div>
                    <label className="block text-sm font-medium text-text-secondary">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                    />
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full cursor-pointer rounded bg-primary py-2 font-medium text-primary-text hover:bg-primary-hover disabled:opacity-50"
                >
                    {submitting ? 'Sending...' : 'Send reset link'}
                </button>

                <p className="text-center text-sm text-text-secondary">
                    <Link href="/login" className="text-primary hover:underline">
                        Back to sign in
                    </Link>
                </p>
            </form>
        </main>
    );
}
