export interface IModelTracking {
  id?: number;
  tvModel: string;
  region: string;
  toolOptions: string;
  testingNow: string | null;
  panelType: string;
  startDate: Date | string;
  endDate: Date | string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IModelTrackingCreate {
  tvModel: string;
  region: string;
  toolOptions: string;
  testingNow: string | null;
  panelType: string;
  startDate: Date | string;
  endDate?: Date | string | null;
}

export interface IModelTrackingUpdate {
  tvModel?: string;
  region?: string;
  toolOptions?: string;
  testingNow?: string | null;
  panelType?: string;
  startDate?: Date | string;
  endDate?: Date | string | null;
}




