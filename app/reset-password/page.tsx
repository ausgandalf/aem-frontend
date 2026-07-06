'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token') ?? '';
    const email = searchParams.get('email') ?? '';

    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        const res = await api('/api/reset-password', {
            method: 'POST',
            body: JSON.stringify({
                token,
                email,
                password,
                password_confirmation: passwordConfirmation,
            }),
        });
        const data = await res.json();

        if (res.ok) {
            setDone(true);
        } else {
            const firstError = data.errors
                ? (Object.values(data.errors)[0] as string[])[0]
                : data.message;
            setError(firstError ?? 'Reset failed');
            setSubmitting(false);
        }
    };

    if (done) {
        return (
            <div className="w-full max-w-md space-y-4 rounded-lg border border-border-token bg-surface p-8 text-center shadow-sm">
                <h1 className="text-2xl font-bold text-text-primary">Password reset</h1>
                <p className="text-sm text-text-secondary">
                    Your password has been updated. You can now sign in with your new password.
                </p>
                <Link
                    href="/login"
                    className="inline-block rounded bg-primary px-4 py-2 font-medium text-primary-text hover:bg-primary-hover"
                >
                    Go to sign in
                </Link>
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="w-full max-w-md space-y-4 rounded-lg border border-border-token bg-surface p-8 shadow-sm"
        >
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-text-primary">Choose a new password</h1>
                <ThemeToggle />
            </div>

            {!token || !email ? (
                <div className="rounded bg-danger-bg p-3 text-sm text-danger-text">
                    This reset link is invalid or incomplete. Please request a new one.
                </div>
            ) : (
                <>
                    {error && (
                        <div className="rounded bg-danger-bg p-3 text-sm text-danger-text">{error}</div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-text-secondary">Email</label>
                        <input
                            type="email"
                            value={email}
                            readOnly
                            className="mt-1 w-full cursor-not-allowed rounded border border-border-token bg-surface-hover px-3 py-2 text-text-muted"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary">New password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                            className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                        />
                        <p className="mt-1 text-xs text-text-muted">
                            At least 8 characters, with upper &amp; lower case and a number.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary">
                            Confirm new password
                        </label>
                        <input
                            type="password"
                            value={passwordConfirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                            required
                            autoComplete="new-password"
                            className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full cursor-pointer rounded bg-primary py-2 font-medium text-primary-text hover:bg-primary-hover disabled:opacity-50"
                    >
                        {submitting ? 'Resetting...' : 'Reset password'}
                    </button>
                </>
            )}
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-background p-4">
            <Suspense fallback={<div className="text-text-secondary">Loading...</div>}>
                <ResetPasswordContent />
            </Suspense>
        </main>
    );
}
