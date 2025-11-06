import { Router } from 'express';
import { body } from 'express-validator';
import {
  createSessionTemplateHandler,
  getSessionTemplatesHandler,
  getSessionTemplateHandler,
  updateSessionTemplateHandler,
  deleteSessionTemplateHandler,
  bulkCreateSessionsHandler,
} from '../controllers/sessionTemplateController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all templates for a community
router.get('/community/:community_id', getSessionTemplatesHandler);

// Get single template
router.get('/:id', getSessionTemplateHandler);

// Create new template
router.post(
  '/',
  validate([
    body('community_id').isUUID().withMessage('Valid community_id is required'),
    body('sub_community_id').optional().isUUID().withMessage('sub_community_id must be a valid UUID'),
    body('title').notEmpty().withMessage('Title is required'),
    body('description').optional().isString(),
    body('day_of_week')
      .isInt({ min: 0, max: 6 })
      .withMessage('day_of_week must be between 0 (Sunday) and 6 (Saturday)'),
    body('time_of_day')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
      .withMessage('time_of_day must be in HH:MM or HH:MM:SS format'),
    body('duration_minutes').optional().isInt({ min: 30, max: 300 }).withMessage('duration_minutes must be between 30 and 300'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('max_players').isInt({ min: 1 }).withMessage('max_players must be at least 1'),
    body('free_cancellation_hours').optional().isInt({ min: 0 }),
    body('allow_conditional_cancellation').optional().isBoolean(),
    body('is_active').optional().isBoolean(),
  ]),
  createSessionTemplateHandler
);

// Update template
router.put(
  '/:id',
  validate([
    body('sub_community_id').optional().isUUID(),
    body('title').optional().notEmpty(),
    body('description').optional().isString(),
    body('day_of_week').optional().isInt({ min: 0, max: 6 }),
    body('time_of_day')
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/),
    body('duration_minutes').optional().isInt({ min: 30, max: 300 }),
    body('price').optional().isFloat({ min: 0 }),
    body('max_players').optional().isInt({ min: 1 }),
    body('free_cancellation_hours').optional().isInt({ min: 0 }),
    body('allow_conditional_cancellation').optional().isBoolean(),
    body('is_active').optional().isBoolean(),
  ]),
  updateSessionTemplateHandler
);

// Delete template
router.delete('/:id', deleteSessionTemplateHandler);

// Bulk create sessions from templates
router.post(
  '/bulk-create-sessions',
  validate([
    body('template_ids').isArray({ min: 1 }).withMessage('template_ids must be a non-empty array'),
    body('template_ids.*').isUUID().withMessage('Each template_id must be a valid UUID'),
    body('weeks_ahead').isInt({ min: 1, max: 12 }).withMessage('weeks_ahead must be between 1 and 12'),
    body('start_date').optional().isISO8601().withMessage('start_date must be a valid ISO 8601 date'),
  ]),
  bulkCreateSessionsHandler
);

export default router;
