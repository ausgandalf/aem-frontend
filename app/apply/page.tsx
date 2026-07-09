'use client';

import QuickApplyForm from '@/components/apply/QuickApplyForm';
import ThemeToggle from '@/components/ThemeToggle';

export default function ApplyPage() {
    return (
        <main className="min-h-screen bg-background">
            <header className="border-b border-border-token bg-surface">
                <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
                    <span className="text-lg font-bold text-text-primary">WRBLO — Quick Apply</span>
                    <ThemeToggle />
                </div>
            </header>

            <div className="mx-auto max-w-3xl px-4 py-8">
                <p className="mb-8 text-sm text-text-secondary">
                    Apply for funding in three short steps. Fields marked with
                    <span className="text-danger"> *</span> are required. Hover the
                    <span className="mx-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-border-token text-[10px] font-bold text-text-muted">
                        ?
                    </span>
                    icons for guidance.
                </p>

                <QuickApplyForm />
            </div>
        </main>
    );
}
