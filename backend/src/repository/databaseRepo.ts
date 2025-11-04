import pool from '../db/pool';
import { TestType, TEST_CAPACITY_LIMITS, TestingCapacityError } from '../config/constants';
import { ModelTracker } from '../models/interfaces';

type DbModelRow = {
  id: number;
  tv_model: string;
  region: string;
  tool_options: string;
  testing_now: string | null;
  panel_type: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
};

type DbTestRow = {
  id: number;
  model_id: number;
  tag: string;
  test_type: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
};

function normalizeTestType(tag: string): TestType {
  const normalized = tag.trim().toLowerCase();
  if (normalized === 'cst') return TestType.CST;
  if (normalized === 'chamber') return TestType.Chamber;
  if (normalized === 'performance' || normalized === 'performance test') return TestType.Performance;
  throw new Error(`Unknown test type: ${tag}`);
}

export class ModelTrackingModel {
  static async initializeTable(): Promise<void> {
    const client = await pool.connect();
    try {
      console.log('[Repo:initializeTable] Creating tables if not exist');
      await client.query('BEGIN');
      await client.query(`
        CREATE TABLE IF NOT EXISTS model_trackings (
          id SERIAL PRIMARY KEY,
          tv_model TEXT NOT NULL,
          region TEXT NOT NULL,
          tool_options TEXT NOT NULL,
          testing_now TEXT,
          panel_type TEXT NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS model_tests (
          id SERIAL PRIMARY KEY,
          model_id INTEGER NOT NULL REFERENCES model_trackings(id) ON DELETE CASCADE,
          tag TEXT NOT NULL,
          test_type TEXT NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      await client.query('COMMIT');
      console.log('[Repo:initializeTable] Migrations committed');
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('[Repo:initializeTable] Error, rolled back:', e);
      throw e;
    } finally {
      client.release();
    }
  }

  static async findAll(): Promise<ModelTracker[]> {
    console.log('[Repo:findAll] Querying all model_trackings');
    const { rows } = await pool.query<DbModelRow>('SELECT * FROM model_trackings ORDER BY id DESC');
    console.log(`[Repo:findAll] Found rows=${rows.length}`);
    const models = await Promise.all(rows.map(async (r: DbModelRow) => this.mapRowToDomain(r)));
    return models;
  }

  static async findById(id: number): Promise<ModelTracker | null> {
    console.log('[Repo:findById] id=', id);
    const { rows } = await pool.query<DbModelRow>('SELECT * FROM model_trackings WHERE id = $1', [id]);
    if (!rows[0]) return null;
    return this.mapRowToDomain(rows[0]);
  }

  static async create(payload: ModelTracker): Promise<ModelTracker> {
    console.log('[Repo:create] Creating model', { tvModel: payload.tvModel, region: payload.region });
    await this.validateModelDates(payload);
    await this.ensureCapacityForTests(payload.testingItems);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const insertModel = await client.query<DbModelRow>(
        `INSERT INTO model_trackings (
          tv_model, region, tool_options, testing_now, panel_type, start_date, end_date
        ) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [
          payload.tvModel,
          payload.region,
          payload.toolOptions,
          payload.testingNow,
          payload.panelType,
          toDate(payload.startDate),
          payload.endDate ? toDate(payload.endDate) : null,
        ]
      );
      const modelRow = insertModel.rows[0];
      console.log('[Repo:create] Inserted model id=', modelRow.id);
      for (const t of payload.testingItems) {
        const testType = normalizeTestType(t.tag);
        await client.query(
          `INSERT INTO model_tests (model_id, tag, test_type, start_date, end_date)
           VALUES ($1,$2,$3,$4,$5)`,
          [modelRow.id, t.tag, testType, toDate(t.startDate), t.endDate ? toDate(t.endDate) : null]
        );
        console.log('[Repo:create] Inserted test', { modelId: modelRow.id, tag: t.tag, testType });
      }

      await client.query('COMMIT');
      console.log('[Repo:create] Transaction committed id=', modelRow.id);
      return await this.findById(modelRow.id) as ModelTracker;
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('[Repo:create] Error, rolled back:', e);
      throw e;
    } finally {
      client.release();
    }
  }

  static async update(id: number, payload: Partial<ModelTracker>): Promise<ModelTracker> {
    const existing = await this.findById(id);
    if (!existing) throw new Error('Model tracking entry not found');

    const merged: ModelTracker = {
      ...existing,
      ...payload,
      testingItems: payload.testingItems ?? existing.testingItems,
    } as ModelTracker;

    console.log('[Repo:update] Updating id=', id);
    await this.validateModelDates(merged);
    await this.ensureCapacityForTests(merged.testingItems, id);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE model_trackings SET
          tv_model=$1, region=$2, tool_options=$3, testing_now=$4, panel_type=$5,
          start_date=$6, end_date=$7, updated_at=NOW()
        WHERE id=$8`,
        [
          merged.tvModel,
          merged.region,
          merged.toolOptions,
          merged.testingNow,
          merged.panelType,
          toDate(merged.startDate),
          merged.endDate ? toDate(merged.endDate) : null,
          id,
        ]
      );

      await client.query('DELETE FROM model_tests WHERE model_id=$1', [id]);
      console.log('[Repo:update] Cleared existing tests for id=', id);
      for (const t of merged.testingItems) {
        const testType = normalizeTestType(t.tag);
        await client.query(
          `INSERT INTO model_tests (model_id, tag, test_type, start_date, end_date)
           VALUES ($1,$2,$3,$4,$5)`,
          [id, t.tag, testType, toDate(t.startDate), t.endDate ? toDate(t.endDate) : null]
        );
        console.log('[Repo:update] Inserted test', { id, tag: t.tag, testType });
      }
      await client.query('COMMIT');
      console.log('[Repo:update] Transaction committed id=', id);
      return await this.findById(id) as ModelTracker;
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('[Repo:update] Error, rolled back:', e);
      throw e;
    } finally {
      client.release();
    }
  }

  static async delete(id: number): Promise<void> {
    console.log('[Repo:delete] Deleting id=', id);
    await pool.query('DELETE FROM model_trackings WHERE id = $1', [id]);
    console.log('[Repo:delete] Deleted id=', id);
  }

  private static async mapRowToDomain(row: DbModelRow): Promise<ModelTracker> {
    const tests = await pool.query<DbTestRow>('SELECT * FROM model_tests WHERE model_id = $1 ORDER BY id', [row.id]);
    return {
      id: row.id,
      tvModel: row.tv_model,
      region: row.region,
      toolOptions: row.tool_options,
      testingNow: row.testing_now,
      panelType: row.panel_type,
      testingItems: tests.rows.map((t) => ({ tag: t.tag, startDate: t.start_date, endDate: t.end_date })),
      startDate: row.start_date,
      endDate: row.end_date,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private static async ensureCapacityForTests(
    tests: Array<{ tag: string; startDate: string; endDate: string | null }>,
    excludeModelId?: number
  ): Promise<void> {
    for (const t of tests as Array<{ tag: string; startDate: string; endDate: string | null }>) {
      const type = normalizeTestType(t.tag);
      const limit = TEST_CAPACITY_LIMITS[type];
      const start = toDate(t.startDate);
      const end = t.endDate ? toDate(t.endDate) : null;
      console.log('[Repo:ensureCapacity] Checking', { type, start, end, excludeModelId });
      const { rows } = await pool.query<{ cnt: string }>(
        `SELECT COUNT(*)::int AS cnt
         FROM model_tests mt
         JOIN model_trackings m ON m.id = mt.model_id
         WHERE mt.test_type = $1
           AND (mt.end_date IS NULL OR mt.end_date >= $2)
           AND ( mt.start_date <= $3 ) 
           ${excludeModelId ? 'AND mt.model_id <> $4' : ''}
        `,
        excludeModelId ? [type, start, end, excludeModelId] : [type, start, end]
      );
      const current = Number(rows[0]?.cnt || 0);
      console.log('[Repo:ensureCapacity] Current count:', current, 'limit:', limit);
      if (current >= limit) {
        throw new TestingCapacityError(
          `${type} capacity exceeded for the given period (${formatDate(start)} to ${end ? formatDate(end) : 'open'})`
        );
      }
    }
  }

  private static async validateModelDates(model: ModelTracker): Promise<void> {
    const start = new Date(model.startDate);
    const end = model.endDate ? new Date(model.endDate) : null;
    if (start === null || start === undefined || end === null || end === undefined) {
      throw new Error('Please provide both a start and end value.');
  }
    console.log('[Repo:validateModelDates] Model window', { start: toDate(start), end: end ? toDate(end) : null });
    if (end && end < start) throw new Error('endDate cannot be before startDate');
    for (const t of model.testingItems) {
      const ts = new Date(t.startDate);
      const te = t.endDate ? new Date(t.endDate) : null;
      if (ts === null || ts === undefined || te === null || te === undefined) {
        throw new Error('Please provide both a start and end value.');
    }
      if (te && te < ts) throw new Error(`Test ${t.tag} endDate cannot be before startDate`);
      if (ts < start) throw new Error(`Test ${t.tag} starts before model startDate`);
      if (end && te && te > end) throw new Error(`Test ${t.tag} ends after model endDate`);
      if (end && !te && end) {/* allow open-ended test within model window */}
    }
  }
}

function toDate(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDate(d: string | Date): string {
  return toDate(d);
}


