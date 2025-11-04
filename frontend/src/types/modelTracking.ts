export interface IModelTracking {
  id?: number;
  tvModel: string;
  region: string;
  toolOptions: string;
  testingNow: string | null;
  testingNowPeriods?: Array<{ tag: string; startDate: string; endDate: string | null }>;
  panelType: string;
  startDate: Date | string;
  endDate: Date | string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IModelTrackingCreate {
  tvModel: string;
  toolOptions: string;
  region?: string;
  testingNow: string | null;
  testingNowPeriods?: Array<{ tag: string; startDate: string; endDate: string | null }>;
  panelType: string;
  startDate: Date | string;
  endDate?: Date | string | null;
}

export interface IModelTrackingUpdate {
  tvModel?: string;
  region?: string;
  toolOptions?: string;
  testingNow?: string | null;
  testingNowPeriods?: Array<{ tag: string; startDate: string; endDate: string | null }>;
  panelType?: string;
  startDate?: Date | string;
  endDate?: Date | string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  count?: number;
}

