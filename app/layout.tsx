import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { RolesProvider } from '@/context/RolesContext';

import './globals.css';

export const metadata: Metadata = {
    title: 'ARM',
    description: 'Applicant Relation Management',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <ThemeProvider>
                    <AuthProvider>
                        <RolesProvider>{children}</RolesProvider>
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}