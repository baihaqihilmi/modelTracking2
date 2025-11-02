import { Router } from 'express';
import {
  ModelTrackingController,
  createValidation,
  updateValidation,
  idValidation,
} from '../controllers/modelTracking.controller';

const router = Router();

// GET /api/model-tracking - Get all entries
router.get('/', ModelTrackingController.getAll);

// GET /api/model-tracking/:id - Get entry by ID
router.get('/:id', idValidation, ModelTrackingController.getById);

// POST /api/model-tracking - Create new entry
router.post('/', createValidation, ModelTrackingController.create);

// PUT /api/model-tracking/:id - Update entry
router.put('/:id', updateValidation, ModelTrackingController.update);

// DELETE /api/model-tracking/:id - Delete entry
router.delete('/:id', idValidation, ModelTrackingController.delete);

export default router;




