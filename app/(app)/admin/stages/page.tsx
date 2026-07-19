'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { useDragSort } from '@/lib/useDragSort';
import Spinner from '@/components/Spinner';
import { GripIcon, PlusIcon, PencilIcon, ChevronIcon } from '@/components/SVGs';
import StageDrawer from './StageDrawer';
import { Stage } from './types';

const orderKey = (stages: Stage[]) => stages.map((s) => s.id).join(',');

export default function StagesPage() {
    const router = useRouter();
    const { user, roles, loading: authLoading } = useAuth();

    const [stages, setStages] = useState<Stage[]>([]);
    const [loading, setLoading] = useState(true);
    const [savedOrder, setSavedOrder] = useState('');
    const [savingOrder, setSavingOrder] = useState(false);
    const [expanded, setExpanded] = useState<number | null>(null);
    const [editId, setEditId] = useState<number | null>(null);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (!authLoading) {
            if (!user) router.push('/login');
            else if (!roles.includes('admin')) router.push('/dashboard');
        }
    }, [user, roles, authLoading, router]);

    const fetchStages = useCallback(async () => {
        setLoading(true);
        const res = await api('/api/admin/stages');
        if (res.ok) {
            const data: Stage[] = await res.json();
            setStages(data);
            setSavedOrder(orderKey(data));
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchStages();
    }, [fetchStages]);

    const { draggingId, dragProps } = useDragSort<Stage>(
        stages,
        (s) => s.id,
        setStages,
    );

    const orderDirty = orderKey(stages) !== savedOrder;

    const saveOrder = async () => {
        setSavingOrder(true);
        const res = await api('/api/admin/stages/reorder', {
            method: 'POST',
            body: JSON.stringify({ ids: stages.map((s) => s.id) }),
        });
        if (res.ok) {
            setSavedOrder(orderKey(stages));
        } else {
            alert('Failed to save order');
        }
        setSavingOrder(false);
    };

    if (authLoading) {
        return <div className="p-8 text-text-secondary">Loading...</div>;
    }

    return (
        <div className="p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-bold text-text-primary">Stages &amp; Sectors</h1>
                <div className="flex items-center gap-3">
                    <button
                        onClick={saveOrder}
                        disabled={!orderDirty || savingOrder}
                        className="cursor-pointer rounded border border-border-token bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {savingOrder ? 'Saving...' : 'Save Orders'}
                    </button>
                    <button
                        onClick={() => setCreating(true)}
                        className="cursor-pointer rounded bg-primary px-4 py-2 text-sm font-medium text-primary-text hover:bg-primary-hover"
                    >
                        + Create New Stage
                    </button>
                </div>
            </div>

            <p className="mb-4 text-sm text-text-muted">
                Drag the handle to reorder stages, then click <span className="font-medium text-text-secondary">Save Orders</span>.
                Expand a stage to preview its sectors, or click Edit to manage them.
            </p>

            {loading && <Spinner label="Loading stages..." />}

            {!loading && (
                <ol className="space-y-2">
                    {stages.map((stage, index) => {
                        const isOpen = expanded === stage.id;
                        return (
                            <li
                                key={stage.id}
                                {...dragProps(stage.id)}
                                className={`overflow-hidden rounded-lg border border-border-token bg-surface transition-shadow ${
                                    draggingId === stage.id ? 'opacity-50 shadow-lg' : ''
                                }`}
                            >
                                <div className="flex items-center gap-3 px-3 py-3">
                                    <span
                                        className="cursor-grab text-text-muted active:cursor-grabbing"
                                        title="Drag to reorder"
                                    >
                                        <GripIcon size={18} />
                                    </span>

                                    
                                    <button
                                        onClick={() => setExpanded(isOpen ? null : stage.id)}
                                        title={isOpen ? 'Collapse' : 'Show sectors'}
                                        aria-label="Toggle sectors"
                                        className="cursor-pointer rounded border border-text-secondary p-1.5 text-text-secondary hover:border-primary hover:text-primary"
                                    >
                                        <PlusIcon
                                            size={16}
                                            className={`transition-transform duration-300 ${
                                                isOpen ? 'rotate-45' : ''
                                            }`}
                                        />
                                    </button>
                                    
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-dark text-xs font-semibold text-text-secondary">
                                        {index + 1}
                                    </span>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="truncate font-medium text-text-primary">
                                                {stage.label}
                                            </span>
                                            <span className="rounded bg-surface-dark px-1.5 py-0.5 font-mono text-xs text-text-muted">
                                                {stage.key}
                                            </span>
                                            {stage.status !== 'on' && (
                                                <span className="rounded bg-danger-bg px-1.5 py-0.5 text-xs font-medium text-danger-text">
                                                    off
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-0.5 text-xs text-text-muted">
                                            {stage.role} · {stage.sectors.length} sector
                                            {stage.sectors.length === 1 ? '' : 's'}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setEditId(stage.id)}
                                        className="cursor-pointer flex items-center gap-1.5 rounded border border-text-secondary px-3 py-1.5 text-sm text-text-secondary hover:border-primary hover:text-primary"
                                    >
                                        <PencilIcon size={14} />
                                        Edit
                                    </button>
                                </div>

                                {/* Accordion: read-only sector preview */}
                                <div
                                    className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                                        isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                                    }`}
                                >
                                    <div className="overflow-hidden">
                                        <div className="border-t border-border-token bg-background px-4 py-3">
                                            {stage.sectors.length === 0 ? (
                                                <p className="text-sm text-text-muted">
                                                    No sectors. Click Edit to add some.
                                                </p>
                                            ) : (
                                                <ul className="space-y-1.5">
                                                    {stage.sectors.map((sec) => (
                                                        <li
                                                            key={sec.id}
                                                            className="flex items-start gap-2 text-sm"
                                                        >
                                                            <ChevronIcon
                                                                size={14}
                                                                className="mt-1 shrink-0 text-text-muted"
                                                            />
                                                            <div className="min-w-0">
                                                                <span className="font-medium text-text-primary">
                                                                    {sec.label}
                                                                </span>
                                                                <span className="ml-2 font-mono text-xs text-text-muted">
                                                                    {sec.key}
                                                                </span>
                                                                {sec.description && (
                                                                    <p className="text-xs text-text-muted">
                                                                        {sec.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        );
                    })}

                    {stages.length === 0 && (
                        <li className="rounded-lg border border-dashed border-border-token p-10 text-center text-text-muted">
                            No stages yet. Create your first one.
                        </li>
                    )}
                </ol>
            )}

            {(editId !== null || creating) && (
                <StageDrawer
                    stage={editId !== null ? stages.find((s) => s.id === editId) ?? null : null}
                    onClose={() => {
                        setEditId(null);
                        setCreating(false);
                    }}
                    onChanged={fetchStages}
                />
            )}
        </div>
    );
}
