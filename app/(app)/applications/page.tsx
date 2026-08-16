'use client';

import { useAuth } from '@/context/AuthContext';
import { useStages } from '@/lib/useStages';
import Spinner from '@/components/Spinner';
import MyApplications from './MyApplications';
import OfficerApplications from './OfficerApplications';

// Role-aware Applications page: officers (any role that handles a workflow stage)
// see the review queue; everyone else sees their own applications.
export default function ApplicationsPage() {
    const { roles, loading: authLoading } = useAuth();
    const { stages, loading: stagesLoading } = useStages();

    if (authLoading || stagesLoading) {
        return (
            <div className="p-8">
                <Spinner label="Loading…" />
            </div>
        );
    }

    const isOfficer = stages.some((s) => roles.includes(s.role));

    return isOfficer ? <OfficerApplications /> : <MyApplications />;
}
