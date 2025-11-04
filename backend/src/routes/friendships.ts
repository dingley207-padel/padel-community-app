import express from 'express';
import { authenticate } from '../middleware/auth';
import * as friendshipController from '../controllers/friendshipController';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Send a friend request
router.post('/request', friendshipController.sendFriendRequest);

// Accept a friend request
router.post('/accept/:friendshipId', friendshipController.acceptFriendRequest);

// Reject a friend request
router.post('/reject/:friendshipId', friendshipController.rejectFriendRequest);

// Remove/unfriend a friend
router.delete('/:friendshipId', friendshipController.removeFriend);

// Get all friends (accepted friendships)
router.get('/friends', friendshipController.getFriends);

// Get pending friend requests (received)
router.get('/requests/pending', friendshipController.getPendingRequests);

// Get sent friend requests
router.get('/requests/sent', friendshipController.getSentRequests);

// Get suggested friends (members from user's communities)
router.get('/suggestions', friendshipController.getSuggestedFriends);

// Check friendship status with a user
router.get('/status/:userId', friendshipController.getFriendshipStatus);

export default router;
