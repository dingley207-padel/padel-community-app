import { Router } from 'express';
import { RoleController } from '../controllers/roleController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get current user's roles
router.get('/my-roles', RoleController.getMyRoles);

// Get all roles (super admin only)
router.get('/all', RoleController.getAllRoles);

// Assign role to user (super admin only)
router.post('/assign', RoleController.assignRole);

// Remove role from user (super admin only)
router.delete('/remove', RoleController.removeRole);

// Get community managers for a community
router.get('/community/:communityId/managers', RoleController.getCommunityManagers);

// Assign community manager (owners and super admins only)
router.post('/community/:communityId/managers', RoleController.assignCommunityManager);

// Revoke community manager (owners and super admins only)
router.delete('/community/:communityId/managers/:userId', RoleController.revokeCommunityManager);

// Search users to add as managers (owners and super admins only)
router.get('/community/:communityId/search-users', RoleController.searchUsersForManager);

// Get communities managed by current user
router.get('/managed-communities', RoleController.getManagedCommunities);

export default router;
