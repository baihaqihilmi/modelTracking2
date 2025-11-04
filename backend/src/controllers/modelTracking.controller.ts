import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { ModelTrackingModel } from '../repository/databaseRepo';
import { TestingCapacityError } from '../config/constants';
import { ModelTracker } from '../models/interfaces';

export const idValidation = [
  param('id').isInt({ gt: 0 }).toInt(),
];

export const createValidation = [
  body('tvModel').isString().trim().notEmpty(),
  body('region').isString().trim().notEmpty(),
  body('toolOptions').isString().trim().notEmpty(),
  body('testingNow').optional({ nullable: true }).isString().trim(),
  body('panelType').isString().trim().notEmpty(),
  body('startDate').isISO8601().toDate(),
  body('endDate').optional({ nullable: true }).isISO8601().toDate(),
  body('testingItems').isArray({ min: 0 }),
  body('testingItems.*.tag').isString().trim().notEmpty(),
  body('testingItems.*.startDate').isISO8601().toDate(),
  body('testingItems.*.endDate').optional({ nullable: true }).isISO8601().toDate(),
];

export const updateValidation = [
  ...idValidation,
  body('tvModel').optional().isString().trim().notEmpty(),
  body('region').optional().isString().trim().notEmpty(),
  body('toolOptions').optional().isString().trim().notEmpty(),
  body('testingNow').optional({ nullable: true }).isString().trim(),
  body('panelType').optional().isString().trim().notEmpty(),
  body('startDate').optional().isISO8601().toDate(),
  body('endDate').optional({ nullable: true }).isISO8601().toDate(),
  body('testingItems').optional().isArray({ min: 0 }),
  body('testingItems.*.tag').optional().isString().trim().notEmpty(),
  body('testingItems.*.startDate').optional().isISO8601().toDate(),
  body('testingItems.*.endDate').optional({ nullable: true }).isISO8601().toDate(),
];

export class ModelTrackingController {
  static async getAll(_req: Request, res: Response): Promise<void> {
    try {
      console.log('[Controller:getAll] Fetching all model tracking entries');
      const models = await ModelTrackingModel.findAll();
      console.log(`[Controller:getAll] Success count=${models.length}`);
      res.status(200).json({ success: true, data: models, count: models.length });
    } catch (error) {
      console.error('[Controller:getAll] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch model tracking entries' });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn('[Controller:getById] Validation failed:', errors.array());
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }
    try {
      console.log(`[Controller:getById] id=${req.params.id}`);
      const model = await ModelTrackingModel.findById(Number(req.params.id));
      if (!model) {
        console.warn(`[Controller:getById] Not found id=${req.params.id}`);
        res.status(404).json({ success: false, message: 'Not found' });
        return;
      }
      console.log(`[Controller:getById] Success id=${req.params.id}`);
      res.status(200).json({ success: true, data: model });
    } catch (error) {
      console.error('[Controller:getById] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch entry' });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn('[Controller:create] Validation failed:', errors.array());
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    try {
      const payload = req.body as ModelTracker;
      console.log('[Controller:create] Creating model', { tvModel: payload.tvModel, region: payload.region });
      const created = await ModelTrackingModel.create(payload);
      console.log('[Controller:create] Created id=', created.id);
      res.status(201).json({ success: true, data: created });
    } catch (error) {
      if (error instanceof TestingCapacityError) {
        console.warn('[Controller:create] Capacity error:', error.message);
        res.status(409).json({ success: false, message: error.message });
        return;
      }
      console.error('[Controller:create] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to create entry' });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn('[Controller:update] Validation failed:', errors.array());
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }
    try {
      const id = Number(req.params.id);
      const payload = req.body as Partial<ModelTracker>;
      console.log('[Controller:update] Updating id=', id);
      const updated = await ModelTrackingModel.update(id, payload);
      console.log('[Controller:update] Updated id=', updated.id);
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      if (error instanceof TestingCapacityError) {
        console.warn('[Controller:update] Capacity error:', error.message);
        res.status(409).json({ success: false, message: error.message });
        return;
      }
      console.error('[Controller:update] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to update entry' });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn('[Controller:delete] Validation failed:', errors.array());
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }
    try {
      const id = Number(req.params.id);
      console.log('[Controller:delete] Deleting id=', id);
      await ModelTrackingModel.delete(id);
      console.log('[Controller:delete] Deleted id=', id);
      res.status(204).send();
    } catch (error) {
      console.error('[Controller:delete] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete entry' });
    }
  }
}


