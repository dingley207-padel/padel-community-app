import { Router } from 'express';
import { body } from 'express-validator';
import {
  createSessionHandler,
  getSessionHandler,
  getAvailableSessionsHandler,
  getManagerSessionsHandler,
  updateSessionHandler,
  cancelSessionHandler,
  getSessionBookingsHandler,
  getManagerStatsHandler,
  getCommunityMembersHandler,
  sendSessionNotificationHandler,
} from '../controllers/sessionController';
import { authenticate, requireRole, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Get available sessions (public or authenticated)
router.get('/available', optionalAuth, getAvailableSessionsHandler);

// Get manager's sessions (must be before /:id route)
router.get(
  '/manager/sessions',
  authenticate,
  requireRole(['community_manager', 'community_owner', 'super_admin']),
  getManagerSessionsHandler
);

// Get manager's dashboard stats (must be before /:id route)
router.get(
  '/manager/stats',
  authenticate,
  requireRole(['community_manager', 'community_owner', 'super_admin']),
  getManagerStatsHandler
);

// Get manager's community members (must be before /:id route)
router.get(
  '/manager/members',
  authenticate,
  requireRole(['community_manager', 'community_owner', 'super_admin']),
  getCommunityMembersHandler
);

// Get single session
router.get('/:id', optionalAuth, getSessionHandler);

// Get session bookings (community owner/manager only)
router.get(
  '/:id/bookings',
  authenticate,
  requireRole(['community_manager', 'community_owner', 'super_admin']),
  getSessionBookingsHandler
);

// Send notification to session attendees (community owner/manager only)
router.post(
  '/:id/notifications',
  authenticate,
  requireRole(['community_manager', 'community_owner', 'super_admin']),
  validate([
    body('title').notEmpty().withMessage('Title is required'),
    body('message').notEmpty().withMessage('Message is required'),
  ]),
  sendSessionNotificationHandler
);

// Create session (community owner/manager only)
router.post(
  '/',
  authenticate,
  requireRole(['community_manager', 'community_owner', 'super_admin']),
  validate([
    body('community_id').isUUID().withMessage('Valid community ID is required'),
    body('title').notEmpty().withMessage('Title is required'),
    body('description').optional().isString(),
    body('datetime').isISO8601().withMessage('Valid datetime is required'),
    body('duration_minutes')
      .optional()
      .isInt({ min: 30, max: 300 })
      .withMessage('Duration must be between 30 and 300 minutes'),
    body('location').notEmpty().withMessage('Location is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
    body('max_players')
      .isInt({ min: 1 })
      .withMessage('Max players must be at least 1'),
    body('visibility').optional().isBoolean(),
    body('free_cancellation_hours')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Free cancellation hours must be a non-negative integer'),
    body('allow_conditional_cancellation')
      .optional()
      .isBoolean()
      .withMessage('Allow conditional cancellation must be a boolean'),
  ]),
  createSessionHandler
);

// Update session (community owner/manager only)
router.put(
  '/:id',
  authenticate,
  requireRole(['community_manager', 'community_owner', 'super_admin']),
  validate([
    body('title').optional().isString(),
    body('description').optional().isString(),
    body('datetime').optional().isISO8601(),
    body('duration_minutes').optional().isInt({ min: 30, max: 300 }),
    body('location').optional().isString(),
    body('price').optional().isFloat({ min: 0 }),
    body('max_players').optional().isInt({ min: 1 }),
    body('visibility').optional().isBoolean(),
    body('free_cancellation_hours').optional().isInt({ min: 0 }),
    body('allow_conditional_cancellation').optional().isBoolean(),
  ]),
  updateSessionHandler
);

// Cancel session (community owner/manager only)
router.delete(
  '/:id',
  authenticate,
  requireRole(['community_manager', 'community_owner', 'super_admin']),
  cancelSessionHandler
);

export default router;
