import express from 'express';
import { authenticate } from '../middleware/auth';
import * as announcementController from '../controllers/announcementController';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get announcements from all user's joined communities
router.get('/my-announcements', announcementController.getMyAnnouncements);

// Get announcements for a specific community
router.get('/community/:communityId', announcementController.getCommunityAnnouncements);

// Create a new announcement (requires community manager or super admin role)
router.post('/', announcementController.createAnnouncement);

// Update an announcement
router.put('/:announcementId', announcementController.updateAnnouncement);

// Delete an announcement
router.delete('/:announcementId', announcementController.deleteAnnouncement);

export default router;
