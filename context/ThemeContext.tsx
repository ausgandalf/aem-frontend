'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (t: Theme) => void;
    resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('system');
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

    // Load saved preference
    useEffect(() => {
        const saved = (localStorage.getItem('theme') as Theme) ?? 'system';
        setThemeState(saved);
    }, []);

    // Apply theme to <html> element
    useEffect(() => {
        const root = document.documentElement;
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

        const apply = () => {
            const isDark =
                theme === 'dark' || (theme === 'system' && systemDark.matches);
            root.classList.toggle('dark', isDark);
            setResolvedTheme(isDark ? 'dark' : 'light');
        };

        apply();

        // React to OS theme changes when in system mode
        systemDark.addEventListener('change', apply);
        return () => systemDark.removeEventListener('change', apply);
    }, [theme]);

    const setTheme = (t: Theme) => {
        setThemeState(t);
        localStorage.setItem('theme', t);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
    return ctx;
}