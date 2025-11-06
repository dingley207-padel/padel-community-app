import { Router } from 'express';
import { body } from 'express-validator';
import express from 'express';
import {
  createCommunityHandler,
  getCommunityHandler,
  getManagerCommunitiesHandler,
  updateCommunityHandler,
  joinCommunityHandler,
  leaveCommunityHandler,
  getUserCommunitiesHandler,
  getAllCommunitiesHandler,
  sendCommunityNotificationHandler,
  getSubCommunitiesHandler,
  createSubCommunityHandler,
  updateSubCommunityHandler,
  deleteSubCommunityHandler,
  joinCommunityWithSubsHandler,
} from '../controllers/communityController';
import { authenticate, requireRole, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Get all communities (public)
router.get('/', optionalAuth, getAllCommunitiesHandler);

// Get user's communities
router.get('/my-communities', authenticate, getUserCommunitiesHandler);

// Get manager's communities
router.get(
  '/manager/communities',
  authenticate,
  requireRole(['community_manager', 'community_owner', 'super_admin']),
  getManagerCommunitiesHandler
);

// Get single community
router.get('/:id', optionalAuth, getCommunityHandler);

// Create community - 10MB limit for community images
router.post(
  '/',
  express.json({ limit: '10mb' }),
  express.urlencoded({ extended: true, limit: '10mb' }),
  authenticate,
  validate([
    body('name').notEmpty().withMessage('Community name is required'),
    body('description').optional().isString(),
    body('location').optional().isString(),
    body('profile_image').optional().isString(),
    body('visibility').optional().isBoolean(),
  ]),
  createCommunityHandler
);

// Update community (manager only) - 10MB limit for community images
router.put(
  '/:id',
  express.json({ limit: '10mb' }),
  express.urlencoded({ extended: true, limit: '10mb' }),
  authenticate,
  validate([
    body('name').optional().isString(),
    body('description').optional().isString(),
    body('location').optional().isString(),
    body('profile_image').optional().isString(),
    body('banner_image').optional().isString(),
  ]),
  updateCommunityHandler
);

// Join community
router.post('/:id/join', authenticate, joinCommunityHandler);

// Leave community
router.post('/:id/leave', authenticate, leaveCommunityHandler);

// Send notification to community members (owner/manager only)
router.post(
  '/:id/notifications',
  authenticate,
  requireRole(['community_manager', 'community_owner', 'super_admin']),
  validate([
    body('title').notEmpty().withMessage('Title is required'),
    body('message').notEmpty().withMessage('Message is required'),
  ]),
  sendCommunityNotificationHandler
);

// Get sub-communities of a parent community
router.get('/:id/sub-communities', optionalAuth, getSubCommunitiesHandler);

// Create sub-community (manager only)
router.post(
  '/:id/sub-communities',
  express.json({ limit: '10mb' }),
  express.urlencoded({ extended: true, limit: '10mb' }),
  authenticate,
  validate([
    body('name').notEmpty().withMessage('Sub-community name is required'),
    body('description').optional().isString(),
    body('location').optional().isString(),
    body('profile_image').optional().isString(),
    body('visibility').optional().isBoolean(),
  ]),
  createSubCommunityHandler
);

// Update sub-community (manager only)
router.put(
  '/:id/sub-communities/:subCommunityId',
  express.json({ limit: '10mb' }),
  express.urlencoded({ extended: true, limit: '10mb' }),
  authenticate,
  validate([
    body('name').optional().isString(),
    body('description').optional().isString(),
    body('location').optional().isString(),
    body('profile_image').optional().isString(),
    body('visibility').optional().isBoolean(),
  ]),
  updateSubCommunityHandler
);

// Delete sub-community (manager only)
router.delete(
  '/:id/sub-communities/:subCommunityId',
  authenticate,
  deleteSubCommunityHandler
);

// Join community with sub-communities
router.post(
  '/:id/join-with-subs',
  authenticate,
  validate([
    body('sub_community_ids').isArray().withMessage('sub_community_ids must be an array'),
  ]),
  joinCommunityWithSubsHandler
);

export default router;
