export default function Spinner({ label = 'Loading...' }: { label?: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-border-token border-t-primary" />
            <span className="text-sm text-text-muted">{label}</span>
        </div>
    );
}