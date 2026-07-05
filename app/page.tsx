'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function Home() {
    const [status, setStatus] = useState('Checking API...');

    useEffect(() => {
        api('/api/me')
            .then(res => {
                if (res.status === 401) setStatus('API connected ✅ (not logged in - expected)');
                else if (res.ok) setStatus('API connected ✅ (logged in!)');
                else setStatus(`API responded: ${res.status}`);
            })
            .catch(() => setStatus('API connection failed ❌ - is Laravel running?'));
    }, []);

    return (
        <main className="flex min-h-screen items-center justify-center">
            <h1 className="text-2xl">{status}</h1>
        </main>
    );
}