'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Spinner from '@/components/Spinner';
import StatusBadge from './StatusBadge';
import { ApplicationDetail, ProgressStage } from './types';

interface Props {
    applicationId: number;
    onClose: () => void;
}

export default function ApplicationProgressDrawer({ applicationId, onClose }: Props) {
    const [application, setApplication] = useState<ApplicationDetail | null>(null);
    const [progress, setProgress] = useState<ProgressStage[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const frame = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    const handleClose = useCallback(() => {
        setVisible(false);
        setTimeout(onClose, 300);
    }, [onClose]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [handleClose]);

    useEffect(() => {
        api(`/api/applications/${applicationId}`)
            .then(async (res) => {
                const body = await res.json();
                if (res.ok && body.application) {
                    setApplication(body.application);
                    setProgress(body.progress ?? []);
                }
                setLoaded(true);
            })
            .catch(() => setLoaded(true));
    }, [applicationId]);

    return (
        <>
            <div
                className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
                    visible ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={handleClose}
            />

            <div
                className={`fixed right-0 top-0 z-50 flex h-full w-[90vw] flex-col border-l border-border-token bg-surface shadow-xl transition-transform duration-300 ease-out ${
                    visible ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex items-center justify-between border-b border-border-token p-4">
                    <h2 className="text-lg font-bold text-text-primary">
                        {application ? application.project_title : 'Application Progress'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="cursor-pointer text-xl text-text-muted hover:text-text-primary"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {!loaded ? (
                        <Spinner label="Loading progress..." />
                    ) : (
                        <div className="mx-auto max-w-2xl">
                            <ol className="relative border-l border-border-token">
                                {progress.map((stage) => {
                                    const isCurrent = application?.current_stage === stage.key;
                                    const reached = stage.status !== null;
                                    return (
                                        <li key={stage.key} className="mb-8 ml-6">
                                            <span
                                                className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                                                    isCurrent
                                                        ? 'bg-primary text-primary-text'
                                                        : reached
                                                          ? 'bg-selected text-primary-text'
                                                          : 'border border-border-token bg-surface text-text-muted'
                                                }`}
                                            >
                                                {stage.order + 1}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <h3
                                                    className={`text-sm font-medium ${
                                                        isCurrent ? 'text-text-primary' : 'text-text-secondary'
                                                    }`}
                                                >
                                                    {stage.label}
                                                </h3>
                                                <StatusBadge status={stage.status} />
                                                {isCurrent && (
                                                    <span className="text-xs font-medium text-primary">
                                                        Current
                                                    </span>
                                                )}
                                            </div>
                                            {stage.note && (
                                                <p className="mt-1 text-xs text-text-muted">{stage.note}</p>
                                            )}
                                        </li>
                                    );
                                })}
                            </ol>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
