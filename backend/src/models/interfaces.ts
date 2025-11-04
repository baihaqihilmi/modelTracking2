export interface ModelTracker{
    id?: number;
    tvModel: string;
    region: string;
    toolOptions: string;
    testingNow: string | null;
    panelType: string;
    testingItems : Array<{ tag: string; startDate: string; endDate: string | null }>;
    testingNowPeriods?: Array<{ tag: string; startDate: string; endDate: string | null }>;
    startDate: Date | string;
    endDate: Date | string | null;
    createdAt?: Date;
    updatedAt?: Date;
}
type CreateModelTracker = Omit<ModelTracker, 'id' | 'createdAt' | 'updatedAt'>;

type UpdateModelTracker = Partial<ModelTracker>;