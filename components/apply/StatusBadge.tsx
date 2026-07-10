interface Props {
    status: string | null;
}

const LABELS: Record<string, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    on_hold: 'On Hold',
    passed: 'Passed',
    rejected: 'Rejected',
};

// Map a status to a color family from the theme tokens
function classesFor(status: string | null): string {
    switch (status) {
        case 'passed':
            return 'bg-success-bg text-success-text';
        case 'rejected':
            return 'bg-danger-bg text-danger-text';
        case 'pending':
        case 'in_progress':
        case 'on_hold':
            return 'bg-warning-bg text-warning-text';
        default:
            return 'bg-surface-hover text-text-muted';
    }
}

export default function StatusBadge({ status }: Props) {
    if (!status) return <span className="text-text-muted">—</span>;
    return (
        <span
            className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${classesFor(status)}`}
        >
            {LABELS[status] ?? status}
        </span>
    );
}
