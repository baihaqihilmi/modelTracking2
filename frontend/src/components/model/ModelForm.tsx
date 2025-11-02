'use client';

import { useState, useEffect } from 'react';
import { IModelTracking, IModelTrackingCreate, IModelTrackingUpdate } from '@/types/modelTracking';
import { createModel, updateModel } from '@/lib/api';
import styles from './ModelForm.module.css';

interface ModelFormProps {
  model?: IModelTracking | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModelForm({ model, onClose, onSuccess }: ModelFormProps) {
  const isEditMode = !!model;
  const [formData, setFormData] = useState<IModelTrackingCreate>({
    tvModel: '',
    region : '',
    toolOptions: '',
    testingNow: null,
    panelType: '',
    startDate: '',
    endDate: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (model) {
      setFormData({
        tvModel: model.tvModel || '',
        region: model.region || '',
        toolOptions: model.toolOptions || '',
        testingNow: model.testingNow || null,
        panelType: model.panelType || '',
        startDate: model.startDate ? new Date(model.startDate).toISOString().split('T')[0] : '',
        endDate: model.endDate ? new Date(model.endDate).toISOString().split('T')[0] : null,
      });
    }
  }, [model]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Normalize empty strings to null
      const normalizedData: IModelTrackingCreate | IModelTrackingUpdate = {
        tvModel: formData.tvModel.trim(),
        region: formData.region.trim(),
        toolOptions: formData.toolOptions.trim(),
        testingNow: formData.testingNow?.trim() || null,
        panelType: formData.panelType.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate || null,
      };

      if (isEditMode && model?.id) {
        await updateModel(model.id, normalizedData);
      } else {
        await createModel(normalizedData as IModelTrackingCreate);
      }

      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof IModelTrackingCreate, value: string | null) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Common testing types
  const testingTypes = [
    'Chamber Test',
    'CST Test',
    'Environmental Test',
    'Performance Test',
    'Durability Test',
  ];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{isEditMode ? 'Update Model' : 'Create New Model'}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="tvModel">
              TV Model <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="tvModel"
              value={formData.tvModel}
              onChange={(e) => handleChange('tvModel', e.target.value)}
              required
              maxLength={255}
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="toolOptions">
              Tool Options <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="toolOptions"
              value={formData.toolOptions}
              onChange={(e) => handleChange('toolOptions', e.target.value)}
              required
              maxLength={255}
              disabled={loading}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="region">
              Region <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="region"
              value={formData.region}
              onChange={(e) => handleChange('region', e.target.value)}
              required
              maxLength={255}
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="testingNow">Testing Now</label>
            <select
              id="testingNow"
              value={formData.testingNow || ''}
              onChange={(e) => handleChange('testingNow', e.target.value || null)}
              disabled={loading}
            >
              <option value="">Not Testing</option>
              {testingTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <small className={styles.helpText}>
              If chamber is full, you cannot add more models to testing.
            </small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="panelType">
              Panel Type <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="panelType"
              value={formData.panelType}
              onChange={(e) => handleChange('panelType', e.target.value)}
              required
              maxLength={255}
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="startDate">
              Start Date <span className={styles.required}>*</span>
            </label>
            <input
              type="date"
              id="startDate"
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="endDate">End Date</label>
            <input
              type="date"
              id="endDate"
              value={formData.endDate || ''}
              onChange={(e) => handleChange('endDate', e.target.value || null)}
              min={formData.startDate || ''}
              disabled={loading}
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

