import { Router } from 'express';
import { body } from 'express-validator';
import {
  getUserCommunityChats,
  getCommunityMessages,
  sendCommunityMessage,
} from '../controllers/chatController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Get all community chats for the authenticated user
router.get('/chats', authenticate, getUserCommunityChats);

// Get messages for a specific community
router.get('/communities/:communityId/messages', authenticate, getCommunityMessages);

// Send a message to a community chat
router.post(
  '/communities/:communityId/messages',
  authenticate,
  validate([
    body('content').notEmpty().withMessage('Message content is required'),
  ]),
  sendCommunityMessage
);

export default router;
