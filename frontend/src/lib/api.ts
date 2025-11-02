import { IModelTracking, IModelTrackingCreate, IModelTrackingUpdate, ApiResponse } from '@/types/modelTracking';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function fetchModels(): Promise<IModelTracking[]> {
  try {
    const response = await fetch(`${API_URL}/api/model-tracking`, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch models');
    }
    
    const data: ApiResponse<IModelTracking[]> = await response.json();
    
    if (!data.success || !data.data) {
      throw new Error(data.message || 'Failed to fetch models');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error fetching models:', error);
    throw error;
  }
}

export async function fetchModelById(id: number): Promise<IModelTracking> {
  try {
    const response = await fetch(`${API_URL}/api/model-tracking/${id}`, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch model');
    }
    
    const data: ApiResponse<IModelTracking> = await response.json();
    
    if (!data.success || !data.data) {
      throw new Error(data.message || 'Failed to fetch model');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error fetching model:', error);
    throw error;
  }
}

export async function createModel(modelData: IModelTrackingCreate): Promise<IModelTracking> {
  try {
    const response = await fetch(`${API_URL}/api/model-tracking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(modelData),
    });
    
    const data: ApiResponse<IModelTracking> = await response.json();
    
    if (!response.ok || !data.success || !data.data) {
      throw new Error(data.message || data.error || 'Failed to create model');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error creating model:', error);
    throw error;
  }
}

export async function updateModel(id: number, modelData: IModelTrackingUpdate): Promise<IModelTracking> {
  try {
    const response = await fetch(`${API_URL}/api/model-tracking/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(modelData),
    });
    
    const data: ApiResponse<IModelTracking> = await response.json();
    
    if (!response.ok || !data.success || !data.data) {
      throw new Error(data.message || data.error || 'Failed to update model');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error updating model:', error);
    throw error;
  }
}

export async function deleteModel(id: number): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/api/model-tracking/${id}`, {
      method: 'DELETE',
    });
    
    const data: ApiResponse<void> = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.message || data.error || 'Failed to delete model');
    }
  } catch (error) {
    console.error('Error deleting model:', error);
    throw error;
  }
}

