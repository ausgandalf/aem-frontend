import { ApplicationCard } from '@/components/apply/types';

export interface StageGroup {
    stage: { key: string; label: string; order: number };
    applications: ApplicationCard[];
}
