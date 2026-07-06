'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';
import Logo from '@/components/Logo';
import UserMenu from '@/components/UserMenu';

interface NavItem {
    href: string;
    label: string;
    adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/admin/users', label: 'Users', adminOnly: true },
    { href: '/admin/organizations', label: 'Organizations', adminOnly: true },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, roles, loading } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    // Any unauthenticated visitor is bounced to login (guard for the whole group)
    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [loading, user, router]);

    // Close the mobile drawer whenever the route changes
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    if (loading) {
        return <div className="p-8 text-text-secondary">Loading...</div>;
    }
    if (!user) return null;

    const visibleItems = NAV_ITEMS.filter(
        (item) => !item.adminOnly || roles.includes('admin')
    );

    // Shared sidebar body, reused by the desktop rail and the mobile drawer
    const sidebarBody = (
        <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 border-b border-border-token px-4 py-4 max-h-[60px]">
                <div className="hidden sm:block">
                    <div className="flex items-center gap-2">
                        <Logo />
                        <span className="text-lg font-bold text-text-primary">AEM</span>
                    </div>
                </div>
                &nbsp;
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-3 border-r border-border-token">
                {visibleItems.map((item) => {
                    const active =
                        pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`block rounded px-3 py-2 text-sm font-medium transition ${
                                active
                                    ? 'bg-selected text-primary-text'
                                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                            }`}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-background">
            {/* Desktop sidebar (always visible on md+) */}
            <aside className="hidden w-60 shrink-0 bg-surface md:block">
                {sidebarBody}
            </aside>

            {/* Mobile drawer backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile drawer (slides in from the left) */}
            <aside
                className={`fixed left-0 top-0 z-50 h-full w-60 bg-surface transition-transform duration-300 md:hidden ${
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {sidebarBody}
            </aside>

            {/* Main column */}
            <div className="flex min-w-0 flex-1 flex-col">
                {/* Mobile top bar with hamburger (hidden on md+) */}
                <header className="flex items-center justify-between gap-3 border-b border-border-token bg-surface px-4 py-3 max-h-[60px]">
                    <div className="flex items-center">
                        <div className="flex items-center md:hidden gap-2">
                            <button
                                onClick={() => setMobileOpen(true)}
                                aria-label="Open menu"
                                className="cursor-pointer rounded p-1 text-text-primary hover:bg-surface-hover"
                            >
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                >
                                    <line x1="3" y1="6" x2="21" y2="6" />
                                    <line x1="3" y1="12" x2="21" y2="12" />
                                    <line x1="3" y1="18" x2="21" y2="18" />
                                </svg>
                            </button>
                            <div className="flex items-center gap-2">
                                <Logo width={80} />
                                <span className="text-lg font-bold text-text-primary">AEM</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <UserMenu />
                    </div>
                </header>

                <main className="min-w-0 flex-1">{children}</main>
            </div>
        </div>
    );
}
