import pool from './database';
import { IModelTracking, IModelTrackingCreate, IModelTrackingUpdate } from '../interfaces/modelTracking.interface';
import { MAX_MODELS_PER_TESTING_TYPE, TestingChamberCapacityError } from '../config/constants';

export class ModelTrackingModel {
  /**
   * Initialize the database table
   */
  static async initializeTable(): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS model_tracking (
        id SERIAL PRIMARY KEY,
        tv_model VARCHAR(255) NOT NULL,
        region VARCHAR(255) NOT NULL,
        tool_options VARCHAR(255) NOT NULL,
        testing_now VARCHAR(255),
        panel_type VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_model_tracking_tv_model ON model_tracking(tv_model);
      CREATE INDEX IF NOT EXISTS idx_model_tracking_start_date ON model_tracking(start_date);
      CREATE INDEX IF NOT EXISTS idx_model_tracking_testing_now ON model_tracking(testing_now) WHERE testing_now IS NOT NULL;
      
      -- Migration: Alter existing table if it exists with BOOLEAN
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'model_tracking' 
          AND column_name = 'testing_now' 
          AND data_type = 'boolean'
        ) THEN
          ALTER TABLE model_tracking 
          ALTER COLUMN testing_now TYPE VARCHAR(255) USING 
            CASE 
              WHEN testing_now = true THEN 'Chamber Test'
              WHEN testing_now = false THEN NULL
              ELSE NULL
            END;
        END IF;
      END $$;
    `;

    try {
      await pool.query(createTableQuery);
      console.log('Model tracking table initialized successfully');
    } catch (error) {
      console.error('Error initializing model tracking table:', error);
      throw error;
    }
  }

  /**
   * Count how many models are currently in testing (testingNow IS NOT NULL and within testing period)
   */
  static async countTestingNow(): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM model_tracking
      WHERE testing_now IS NOT NULL 
        AND testing_now != ''
        AND start_date <= CURRENT_DATE
        AND (end_date IS NULL OR end_date >= CURRENT_DATE)
    `;

    try {
      const result = await pool.query(query);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      console.error('Error counting models in testing:', error);
      throw error;
    }
  }

  /**
   * Check if testing has capacity for one more model
   * Only counts models that are currently in their testing period (between start_date and end_date)
   * Each testing type (Chamber Test, CST Test, etc.) has its own capacity limit (default: 3 models)
   * @param testingType - The testing type to check capacity for (e.g., "Chamber Test", "CST Test")
   * @param excludeId - Optional ID to exclude from count (for update operations)
   * @param startDate - Start date of the new/updated model to check overlap
   * @param endDate - End date of the new/updated model to check overlap (null means ongoing)
   */
  static async checkTestingCapacity(
    testingType: string,
    excludeId?: number,
    startDate?: Date | string,
    endDate?: Date | string | null
  ): Promise<void> {
    if (!startDate) {
      // If no start date provided, just count current active models for this specific testing type
      const query = excludeId
        ? `
          SELECT COUNT(*) as count
          FROM model_tracking
          WHERE testing_now = $2
            AND id != $1
            AND start_date <= CURRENT_DATE
            AND (end_date IS NULL OR end_date >= CURRENT_DATE)
        `
        : `
          SELECT COUNT(*) as count
          FROM model_tracking
          WHERE testing_now = $1
            AND start_date <= CURRENT_DATE
            AND (end_date IS NULL OR end_date >= CURRENT_DATE)
        `;

      const result = excludeId
        ? await pool.query(query, [excludeId, testingType])
        : await pool.query(query, [testingType]);
      
      const currentCount = parseInt(result.rows[0].count, 10);

      if (currentCount >= MAX_MODELS_PER_TESTING_TYPE) {
        throw new TestingChamberCapacityError(
          currentCount,
          MAX_MODELS_PER_TESTING_TYPE,
          testingType
        );
      }
      return;
    }

    // Convert dates to strings for SQL comparison
    const start = typeof startDate === 'string' ? startDate : startDate.toISOString().split('T')[0];
    const end = endDate 
      ? (typeof endDate === 'string' ? endDate : endDate.toISOString().split('T')[0])
      : null;

    // Check for models with overlapping testing periods for THIS SPECIFIC testing type
    // Two periods overlap if:
    // - New start is within existing period, OR
    // - New end (or future if null) is within existing period, OR
    // - New period completely contains an existing period
    const overlapQuery = excludeId
      ? `
        SELECT COUNT(*) as count
        FROM model_tracking
        WHERE testing_now = $2
          AND id != $1
          AND (
            -- Existing period starts before or on new end, and ends after or on new start
            (start_date <= COALESCE($4::DATE, '9999-12-31'::DATE) 
             AND (end_date IS NULL OR end_date >= $3::DATE))
            OR
            -- New period contains an existing period (existing starts after new start and before new end)
            (start_date >= $3::DATE 
             AND start_date <= COALESCE($4::DATE, '9999-12-31'::DATE))
          )
      `
      : `
        SELECT COUNT(*) as count
        FROM model_tracking
        WHERE testing_now = $1
          AND (
            -- Existing period starts before or on new end, and ends after or on new start
            (start_date <= COALESCE($3::DATE, '9999-12-31'::DATE) 
             AND (end_date IS NULL OR end_date >= $2::DATE))
            OR
            -- New period contains an existing period (existing starts after new start and before new end)
            (start_date >= $2::DATE 
             AND start_date <= COALESCE($3::DATE, '9999-12-31'::DATE))
          )
      `;

    try {
      const overlapResult = excludeId
        ? await pool.query(overlapQuery, [excludeId, testingType, start, end])
        : await pool.query(overlapQuery, [testingType, start, end]);
      
      const overlapCount = parseInt(overlapResult.rows[0].count, 10);

      if (overlapCount >= MAX_MODELS_PER_TESTING_TYPE) {
        throw new TestingChamberCapacityError(
          overlapCount,
          MAX_MODELS_PER_TESTING_TYPE,
          testingType
        );
      }
    } catch (error) {
      if (error instanceof TestingChamberCapacityError) {
        throw error;
      }
      console.error('Error checking testing capacity:', error);
      throw error;
    }
  }

  /**
   * Create a new model tracking entry
   */
  static async create(data: IModelTrackingCreate): Promise<IModelTracking> {
    // Check capacity if trying to set testingNow to a non-null/non-empty value
    // Each testing type has its own capacity limit (default: 3 models)
    // Only counts models currently in their testing period (between start_date and end_date)
    if (data.testingNow && data.testingNow.trim() !== '') {
      await this.checkTestingCapacity(
        data.testingNow.trim(),
        undefined,
        data.startDate,
        data.endDate || null
      );
    }

    const insertQuery = `
      INSERT INTO model_tracking (tv_model, region ,  tool_options, testing_now, panel_type, start_date, end_date)
      VALUES ($1, $2, $3, $4, $5, $6 , $7)
      RETURNING id, tv_model, region ,tool_options, testing_now, panel_type, start_date, end_date, created_at, updated_at
    `;

    const values = [
      data.tvModel,
      data.region,
      data.toolOptions,
      data.testingNow,
      data.panelType,
      data.startDate,
      data.endDate || null,
    ];

    try {
      const result = await pool.query(insertQuery, values);
      return this.mapRowToModel(result.rows[0]);
    } catch (error) {
      console.error('Error creating model tracking:', error);
      throw error;
    }
  }

  /**
   * Get all model tracking entries
   */
  static async findAll(): Promise<IModelTracking[]> {
    const query = `
      SELECT id, tv_model, region ,tool_options, testing_now, panel_type, start_date, end_date, created_at, updated_at
      FROM model_tracking
      ORDER BY created_at DESC
    `;

    try {
      const result = await pool.query(query);
      return result.rows.map(row => this.mapRowToModel(row));
    } catch (error) {
      console.error('Error finding all model tracking:', error);
      throw error;
    }
  }

  /**
   * Get a model tracking entry by ID
   */
  static async findById(id: number): Promise<IModelTracking | null> {
    const query = `
      SELECT id, tv_model, region ,tool_options, testing_now, panel_type, start_date, end_date, created_at, updated_at
      FROM model_tracking
      WHERE id = $1
    `;

    try {
      const result = await pool.query(query, [id]);
      if (result.rows.length === 0) {
        return null;
      }
      return this.mapRowToModel(result.rows[0]);
    } catch (error) {
      console.error('Error finding model tracking by ID:', error);
      throw error;
    }
  }

  /**
   * Update a model tracking entry
   */
  static async update(id: number, data: IModelTrackingUpdate): Promise<IModelTracking | null> {
    // First, check if the current record exists
    const currentModel = await this.findById(id);
    if (!currentModel) {
      return null; // Model doesn't exist
    }

    // If trying to set testingNow to a non-null/non-empty value, ALWAYS check capacity
    // This ensures capacity validation applies during editing
    // Each testing type has its own capacity limit (default: 3 models)
    if (data.testingNow !== undefined && data.testingNow !== null && data.testingNow.trim() !== '') {
      // Determine the dates to use for capacity check
      const startDate = data.startDate !== undefined ? data.startDate : currentModel.startDate;
      const endDate = data.endDate !== undefined ? data.endDate : currentModel.endDate;
      const newTestingType = data.testingNow.trim();
      
      // ALWAYS check capacity when setting testingNow, even if it's the same value
      // This ensures we validate:
      // 1. The testing type has capacity available
      // 2. The date range doesn't conflict with other models
      // The excludeId parameter ensures we don't count the current model being updated
      await this.checkTestingCapacity(newTestingType, id, startDate, endDate);
    } else if (data.startDate !== undefined || data.endDate !== undefined) {
      // Even if not changing testingNow, if dates are updated and model is currently in testing,
      // we should check capacity for the current testing type
      if (currentModel.testingNow && currentModel.testingNow.trim() !== '') {
        const startDate = data.startDate !== undefined ? data.startDate : currentModel.startDate;
        const endDate = data.endDate !== undefined ? data.endDate : currentModel.endDate;
        const testingType = currentModel.testingNow.trim();
        await this.checkTestingCapacity(testingType, id, startDate, endDate);
      }
    }

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.tvModel !== undefined) {
      updateFields.push(`tv_model = $${paramCount++}`);
      values.push(data.tvModel);
    }
    if (data.region !== undefined) {
      updateFields.push(`region = $${paramCount++}`);
      values.push(data.region);
    }
    if (data.toolOptions !== undefined) {
      updateFields.push(`tool_options = $${paramCount++}`);
      values.push(data.toolOptions);
    }
    if (data.testingNow !== undefined) {
      updateFields.push(`testing_now = $${paramCount++}`);
      values.push(data.testingNow);
    }
    if (data.panelType !== undefined) {
      updateFields.push(`panel_type = $${paramCount++}`);
      values.push(data.panelType);
    }
    if (data.startDate !== undefined) {
      updateFields.push(`start_date = $${paramCount++}`);
      values.push(data.startDate);
    }
    if (data.endDate !== undefined) {
      updateFields.push(`end_date = $${paramCount++}`);
      values.push(data.endDate);
    }

    if (updateFields.length === 0) {
      return this.findById(id);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const updateQuery = `
      UPDATE model_tracking
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, tv_model,region , region ,tool_options, testing_now, panel_type, start_date, end_date, created_at, updated_at
    `;

    try {
      const result = await pool.query(updateQuery, values);
      if (result.rows.length === 0) {
        return null;
      }
      return this.mapRowToModel(result.rows[0]);
    } catch (error) {
      console.error('Error updating model tracking:', error);
      throw error;
    }
  }

  /**
   * Delete a model tracking entry
   */
  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM model_tracking WHERE id = $1';

    try {
      const result = await pool.query(query, [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting model tracking:', error);
      throw error;
    }
  }

  /**
   * Map database row to IModelTracking interface
   */
  private static mapRowToModel(row: any): IModelTracking {
    return {
      id: row.id,
      tvModel: row.tv_model,
      region : row.region,
      toolOptions: row.tool_options,
      testingNow: row.testing_now,
      panelType: row.panel_type,
      startDate: row.start_date,
      endDate: row.end_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}




