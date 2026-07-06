'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRoles } from '@/context/RolesContext';
import { api } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';

// Roles a user may NOT self-assign at signup (admin assigns these manually)
const NON_SELF_ASSIGNABLE = ['admin', 'marketing'];

export default function SignupPage() {
    const { roles } = useRoles();
    const signupRoles = roles.filter((r) => !NON_SELF_ASSIGNABLE.includes(r.name));

    const [form, setForm] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        phone: '',
        role: '',
        password: '',
        password_confirmation: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);

    const update = (key: keyof typeof form, value: string) =>
        setForm((f) => ({ ...f, [key]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        const res = await api('/api/register', {
            method: 'POST',
            body: JSON.stringify(form),
        });
        const data = await res.json();

        if (res.ok) {
            setDone(true);
        } else {
            const firstError = data.errors
                ? (Object.values(data.errors)[0] as string[])[0]
                : data.message;
            setError(firstError ?? 'Registration failed');
            setSubmitting(false);
        }
    };

    if (done) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-background p-4">
                <div className="w-full max-w-md space-y-4 rounded-lg border border-border-token bg-surface p-8 text-center shadow-sm">
                    <h1 className="text-2xl font-bold text-text-primary">Almost there!</h1>
                    <p className="text-sm text-text-secondary">
                        We&apos;ve sent a verification link to <strong>{form.email}</strong>.
                        Please confirm your email to continue. Staff accounts also need admin
                        approval before you can sign in.
                    </p>
                    <Link
                        href="/login"
                        className="inline-block rounded bg-primary px-4 py-2 font-medium text-primary-text hover:bg-primary-hover"
                    >
                        Back to sign in
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-background p-4">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md space-y-4 rounded-lg border border-border-token bg-surface p-8 shadow-sm"
            >
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-text-primary">Create an account</h1>
                    <ThemeToggle />
                </div>

                {error && (
                    <div className="rounded bg-danger-bg p-3 text-sm text-danger-text">{error}</div>
                )}

                <div className="flex gap-3">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-text-secondary">First name *</label>
                        <input
                            type="text"
                            value={form.first_name}
                            onChange={(e) => update('first_name', e.target.value)}
                            required
                            className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-text-secondary">Middle name</label>
                        <input
                            type="text"
                            value={form.middle_name}
                            onChange={(e) => update('middle_name', e.target.value)}
                            className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-secondary">Last name *</label>
                    <input
                        type="text"
                        value={form.last_name}
                        onChange={(e) => update('last_name', e.target.value)}
                        required
                        className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-secondary">Email *</label>
                    <input
                        type="email"
                        value={form.email}
                        onChange={(e) => update('email', e.target.value)}
                        required
                        className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-secondary">Phone *</label>
                    <input
                        type="text"
                        required
                        value={form.phone}
                        onChange={(e) => update('phone', e.target.value)}
                        className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-secondary">Role *</label>
                    <select
                        value={form.role}
                        onChange={(e) => update('role', e.target.value)}
                        required
                        className="mt-1 w-full rounded border border-border-token bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none"
                    >
                        <option value="" disabled>
                            Select a role
                        </option>
                        {signupRoles.map((r) => (
                            <option key={r.name} value={r.name}>
                                {r.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-secondary">Password *</label>
                    <input
                        type="password"
                        value={form.password}
                        onChange={(e) => update('password', e.target.value)}
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
                        Confirm password *
                    </label>
                    <input
                        type="password"
                        value={form.password_confirmation}
                        onChange={(e) => update('password_confirmation', e.target.value)}
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
                    {submitting ? 'Creating account...' : 'Sign up'}
                </button>

                <p className="text-center text-sm text-text-secondary">
                    Already have an account?{' '}
                    <Link href="/login" className="text-primary hover:underline">
                        Sign in
                    </Link>
                </p>
            </form>
        </main>
    );
}
