'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function UserMenu() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        function onClick(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    // Close on Escape
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false);
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    if (!user) return null;

    const initials = `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase();

    const handleLogout = async () => {
        setOpen(false);
        await logout();
        router.push('/login');
    };

    return (
        <div ref={containerRef} className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={open}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-text transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary"
            >
                {initials || '?'}
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-border-token bg-surface shadow-lg"
                >
                    {/* Header with name + email */}
                    <div className="border-b border-border-token px-4 py-3">
                        <div className="truncate text-sm font-medium text-text-primary">
                            {user.first_name} {user.last_name}
                        </div>
                        <div className="truncate text-xs text-text-muted">{user.email}</div>
                    </div>

                    <nav className="py-1">
                        <Link
                            href="/profile"
                            role="menuitem"
                            onClick={() => setOpen(false)}
                            className="block px-4 py-2 text-sm text-text-primary hover:bg-surface-hover"
                        >
                            Profile
                        </Link>
                        <Link
                            href="/settings"
                            role="menuitem"
                            onClick={() => setOpen(false)}
                            className="block px-4 py-2 text-sm text-text-primary hover:bg-surface-hover"
                        >
                            Settings
                        </Link>
                        <button
                            role="menuitem"
                            onClick={handleLogout}
                            className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-danger hover:bg-surface-hover"
                        >
                            Logout
                        </button>
                    </nav>
                </div>
            )}
        </div>
    );
}
