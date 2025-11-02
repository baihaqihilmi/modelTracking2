'use client';

import { useState, useEffect, useMemo } from 'react';
import { IModelTracking } from '@/types/modelTracking';
import { fetchModels } from '@/lib/api';
import ModelForm from './ModelForm';
import styles from './ModelTable.module.css';

interface ColumnFilters {
  id: string;
  tvModel: string;
  toolOptions: string;
  testingNow: string;
  panelType: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export default function ModelTable() {
  const [models, setModels] = useState<IModelTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingModel, setEditingModel] = useState<IModelTracking | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    id: '',
    tvModel: '',
    region: '',
    toolOptions: '',
    testingNow: '',
    panelType: '',
    startDate: '',
    endDate: '',
    createdAt: '',
    updatedAt: '',
  });

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchModels();
      setModels(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models');
      console.error('Error loading models:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    setEditingModel(null);
    setShowForm(true);
  };

  const handleEditClick = (model: IModelTracking) => {
    setEditingModel(model);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    loadModels();
  };

  const handleColumnFilterChange = (column: keyof ColumnFilters, value: string) => {
    setColumnFilters((prev: ColumnFilters) => ({
      ...prev,
      [column]: value,
    }));
  };

  const clearAllFilters = () => {
    setColumnFilters({
      id: '',
      tvModel: '',
      region: '',
      toolOptions: '',
      testingNow: '',
      panelType: '',
      startDate: '',
      endDate: '',
      createdAt: '',
      updatedAt: '',
    });
  };

  // Filter models based on column filters
  const filteredModels = useMemo(() => {
    return models.filter((model: IModelTracking) => {
      return Object.entries(columnFilters).every(([column, filterValue]) => {
        if (!filterValue || !String(filterValue).trim()) return true;

        const filter = String(filterValue).toLowerCase().trim();
        let fieldValue: string = '';

        switch (column) {
          case 'id':
            fieldValue = model.id?.toString() || '';
            break;
          case 'tvModel':
            fieldValue = model.tvModel || '';
            break;
          case 'region':
            fieldValue = model.region || '';
            break;
          case 'toolOptions':
            fieldValue = model.toolOptions || '';
            break;
          case 'testingNow':
            fieldValue = model.testingNow || '';
            break;
          case 'panelType':
            fieldValue = model.panelType || '';
            break;
          case 'startDate':
            fieldValue = formatDate(model.startDate) || '';
            break;
          case 'endDate':
            fieldValue = formatDate(model.endDate) || '';
            break;
          case 'createdAt':
            fieldValue = formatDate(model.createdAt) || '';
            break;
          case 'updatedAt':
            fieldValue = formatDate(model.updatedAt) || '';
            break;
        }

        return fieldValue.toLowerCase().includes(filter);
      });
    });
  }, [models, columnFilters]);

  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const hasActiveFilters = Object.values(columnFilters).some((filter) => filter.trim() !== '');

  if (loading) {
    return (
      <div className={styles.loading}>
        <p>Loading models...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>Error: {error}</p>
        <button onClick={loadModels} className={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.searchContainer}>
          <div className={styles.filtersHeader}>
            <h3>Column Filters</h3>
            {hasActiveFilters && (
              <button onClick={clearAllFilters} className={styles.clearFiltersButton}>
                Clear All
              </button>
            )}
          </div>
        </div>
        <button onClick={handleCreateClick} className={styles.createButton}>
          + Create New Model
        </button>   
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>
                <div className={styles.filterCell}>
                  <span>ID</span>
                  <input
                    type="text"
                    placeholder="Filter ID..."
                    value={columnFilters.id}
                    onChange={(e) => handleColumnFilterChange('id', e.target.value)}
                    className={styles.columnFilterInput}
                  />
                </div>
              </th>
              <th>
                <div className={styles.filterCell}>
                  <span>TV Model</span>
                  <input
                    type="text"
                    placeholder="Filter TV Model..."
                    value={columnFilters.tvModel}
                    onChange={(e) => handleColumnFilterChange('tvModel', e.target.value)}
                    className={styles.columnFilterInput}
                  />
                </div>
              </th>
              <th>
                <div className={styles.filterCell}>
                  <span>Region</span>
                  <input
                    type="text"
                    placeholder="Filter Region..."
                    value={columnFilters.region}
                    onChange={(e) => handleColumnFilterChange('region', e.target.value)}
                    className={styles.columnFilterInput}
                  />
                </div>
              </th>
              <th>
                <div className={styles.filterCell}>
                  <span>Tool Options</span>
                  <input
                    type="text"
                    placeholder="Filter Tool Options..."
                    value={columnFilters.toolOptions}
                    onChange={(e) => handleColumnFilterChange('toolOptions', e.target.value)}
                    className={styles.columnFilterInput}
                  />
                </div>
              </th>
              <th>
                <div className={styles.filterCell}>
                  <span>Testing Now</span>
                  <input
                    type="text"
                    placeholder="Filter Testing..."
                    value={columnFilters.testingNow}
                    onChange={(e) => handleColumnFilterChange('testingNow', e.target.value)}
                    className={styles.columnFilterInput}
                  />
                </div>
              </th>
              <th>
                <div className={styles.filterCell}>
                  <span>Panel Type</span>
                  <input
                    type="text"
                    placeholder="Filter Panel Type..."
                    value={columnFilters.panelType}
                    onChange={(e) => handleColumnFilterChange('panelType', e.target.value)}
                    className={styles.columnFilterInput}
                  />
                </div>
              </th>
              <th>
                <div className={styles.filterCell}>
                  <span>Start Date</span>
                  <input
                    type="text"
                    placeholder="Filter Start Date..."
                    value={columnFilters.startDate}
                    onChange={(e) => handleColumnFilterChange('startDate', e.target.value)}
                    className={styles.columnFilterInput}
                  />
                </div>
              </th>
              <th>
                <div className={styles.filterCell}>
                  <span>End Date</span>
                  <input
                    type="text"
                    placeholder="Filter End Date..."
                    value={columnFilters.endDate}
                    onChange={(e) => handleColumnFilterChange('endDate', e.target.value)}
                    className={styles.columnFilterInput}
                  />
                </div>
              </th>
              <th>
                <div className={styles.filterCell}>
                  <span>Created At</span>
                  <input
                    type="text"
                    placeholder="Filter Created At..."
                    value={columnFilters.createdAt}
                    onChange={(e) => handleColumnFilterChange('createdAt', e.target.value)}
                    className={styles.columnFilterInput}
                  />
                </div>
              </th>
              <th>
                <div className={styles.filterCell}>
                  <span>Updated At</span>
                  <input
                    type="text"
                    placeholder="Filter Updated At..."
                    value={columnFilters.updatedAt}
                    onChange={(e) => handleColumnFilterChange('updatedAt', e.target.value)}
                    className={styles.columnFilterInput}
                  />
                </div>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredModels.length === 0 ? (
              <tr>
                <td colSpan={10} className={styles.noData}>
                  {hasActiveFilters
                    ? 'No models found matching your filters.'
                    : 'No models available.'}
                </td>
              </tr>
            ) : (
              filteredModels.map((model) => (
                <tr key={model.id}>
                  <td>{model.id || '-'}</td>
                  <td>{model.tvModel || '-'}</td>
                  <td>{model.region || '-'}</td>
                  <td>{model.toolOptions || '-'}</td>
                  <td>
                    <span
                      className={`${styles.testingBadge} ${
                        model.testingNow ? styles.testingActive : styles.testingInactive
                      }`}
                    >
                      {model.testingNow || 'Not Testing'}
                    </span>
                  </td>
                  <td>{model.panelType || '-'}</td>
                  <td>{formatDate(model.startDate)}</td>
                  <td>{formatDate(model.endDate)}</td>
                  <td>{formatDate(model.createdAt)}</td>
                  <td>{formatDate(model.updatedAt)}</td>
                  <td>
                    <button
                      onClick={() => handleEditClick(model)}
                      className={styles.editButton}
                      title="Edit Model"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.footer}>
        <span className={styles.resultCount}>
          Showing {filteredModels.length} of {models.length} models
        </span>
      </div>

      {showForm && (
        <ModelForm
          model={editingModel}
          onClose={() => {
            setShowForm(false);
            setEditingModel(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
