import AppShell from '@/components/AppShell';

// Shared shell (sidebar + mobile hamburger) for all authenticated app pages.
// The (app) route group does not affect URLs — /dashboard, /admin/* stay the same.
export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
    return <AppShell>{children}</AppShell>;
}
