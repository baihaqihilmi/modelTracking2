import { Request, Response } from 'express';
import { ModelTrackingModel } from '../models/modelTracking.model';
import { IModelTrackingCreate, IModelTrackingUpdate } from '../interfaces/modelTracking.interface';
import { validationResult, body, param } from 'express-validator';
import { TestingChamberCapacityError } from '../config/constants';

export class ModelTrackingController {
  /**
   * Get all model tracking entries
   */
  static async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const models = await ModelTrackingModel.findAll();
      res.status(200).json({
        success: true,
        data: models,
        count: models.length,
      });
    } catch (error) {
      console.error('Error in getAll:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch model tracking entries',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get a single model tracking entry by ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid ID format',
        });
        return;
      }

      const model = await ModelTrackingModel.findById(id);

      if (!model) {
        res.status(404).json({
          success: false,
          message: 'Model tracking entry not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: model,
      });
    } catch (error) {
      console.error('Error in getById:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch model tracking entry',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Create a new model tracking entry
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      // Normalize testingNow: empty string becomes null
      const testingNow = req.body.testingNow;
      const normalizedTestingNow = 
        testingNow === null || testingNow === undefined || testingNow === '' 
          ? null 
          : String(testingNow).trim() || null;

      const data: IModelTrackingCreate = {
        tvModel: req.body.tvModel,
        region: req.body.region,
        toolOptions: req.body.toolOptions,
        testingNow: normalizedTestingNow,
        panelType: req.body.panelType,
        startDate: req.body.startDate,
        endDate: req.body.endDate || null,

      };

      const model = await ModelTrackingModel.create(data);

      res.status(201).json({
        success: true,
        message: 'Model tracking entry created successfully',
        data: model,
      });
    } catch (error) {
      console.error('Error in create:', error);
      
      if (error instanceof TestingChamberCapacityError) {
        res.status(409).json({
          success: false,
          message: error.message,
          error: 'Testing chamber capacity exceeded',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create model tracking entry',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update a model tracking entry
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid ID format',
        });
        return;
      }

      const data: IModelTrackingUpdate = {};

      if (req.body.tvModel !== undefined) data.tvModel = req.body.tvModel;
      if (req.body.region !== undefined) data.region = req.body.region;
      if (req.body.toolOptions !== undefined) data.toolOptions = req.body.toolOptions;
      if (req.body.testingNow !== undefined) {
        // Normalize testingNow: empty string becomes null
        const testingNow = req.body.testingNow;
        data.testingNow = 
          testingNow === null || testingNow === undefined || testingNow === '' 
            ? null 
            : String(testingNow).trim() || null;
      }
      if (req.body.panelType !== undefined) data.panelType = req.body.panelType;
      if (req.body.startDate !== undefined) data.startDate = req.body.startDate;
      if (req.body.endDate !== undefined) data.endDate = req.body.endDate;

      const model = await ModelTrackingModel.update(id, data);

      if (!model) {
        res.status(404).json({
          success: false,
          message: 'Model tracking entry not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Model tracking entry updated successfully',
        data: model,
      });
    } catch (error) {
      console.error('Error in update:', error);
      
      if (error instanceof TestingChamberCapacityError) {
        res.status(409).json({
          success: false,
          message: error.message,
          error: 'Testing chamber capacity exceeded',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update model tracking entry',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Delete a model tracking entry
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid ID format',
        });
        return;
      }

      const deleted = await ModelTrackingModel.delete(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Model tracking entry not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Model tracking entry deleted successfully',
      });
    } catch (error) {
      console.error('Error in delete:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete model tracking entry',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

// Validation rules
export const createValidation = [
  body('tvModel')
    .trim()
    .notEmpty()
    .withMessage('TV Model is required')
    .isLength({ max: 255 })
    .withMessage('TV Model must be less than 255 characters'),
  body('region')
    .trim()
    .notEmpty()
    .withMessage('Region is required')
    .isLength({ max: 255 })
    .withMessage('Region must be less than 255 characters'), 
  body('toolOptions')
    .trim()
    .notEmpty()
    .withMessage('Tool Options is required')
    .isLength({ max: 255 })
    .withMessage('Tool Options must be less than 255 characters'),
  body('testingNow')
    .optional()
    .custom((value: any) => {
      if (value === null || value === undefined || value === '') {
        return true; // Allow null, undefined, or empty string
      }
      return typeof value === 'string';
    })
    .withMessage('Testing Now must be a string (e.g., "Chamber Test", "CST Test") or null')
    .bail()
    .isLength({ max: 255 })
    .withMessage('Testing Now must be less than 255 characters'),
  body('panelType')
    .trim()
    .notEmpty()
    .withMessage('Panel Type is required')
    .isLength({ max: 255 })
    .withMessage('Panel Type must be less than 255 characters'),
  body('startDate')
    .notEmpty()
    .withMessage('Start Date is required')
    .isISO8601()
    .withMessage('Start Date must be a valid date (ISO 8601 format)'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End Date must be a valid date (ISO 8601 format)'),
];

export const updateValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),
  body('tvModel')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('TV Model must be less than 255 characters'),
  body('region')
    .trim()
    .notEmpty()
    .withMessage('Region is required')
    .isLength({ max: 255 })
    .withMessage('Region must be less than 255 characters'), 
  body('toolOptions')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Tool Options must be less than 255 characters'),
  body('testingNow')
    .optional()
    .custom((value: any) => {
      if (value === null || value === undefined || value === '') {
        return true; // Allow null, undefined, or empty string
      }
      return typeof value === 'string';
    })
    .withMessage('Testing Now must be a string (e.g., "Chamber Test", "CST Test") or null')
    .bail()
    .isLength({ max: 255 })
    .withMessage('Testing Now must be less than 255 characters'),
  body('panelType')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Panel Type must be less than 255 characters'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start Date must be a valid date (ISO 8601 format)'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End Date must be a valid date (ISO 8601 format)'),
];

export const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),
];

