'use client';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    const options: { value: 'light' | 'system' | 'dark'; label: string }[] = [
        { value: 'light', label: '☀️' },
        { value: 'system', label: '💻' },
        { value: 'dark', label: '🌙' },
    ];

    return (
        <div className="flex rounded-lg border border-border-token bg-surface p-1">
            {options.map(opt => (
                <button
                    key={opt.value}
                    onClick={
                        (e) => {
                            e.preventDefault();
                            setTheme(opt.value);
                        }
                    }
                    title={opt.value}
                    className={`cursor-pointer rounded px-2 py-1 text-sm transition ${
                        theme === opt.value
                            ? 'bg-selected text-primary-text'
                            : 'text-text-secondary hover:bg-surface-hover'
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}