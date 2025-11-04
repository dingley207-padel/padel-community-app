import { Response } from 'express';
import { AuthRequest, AssignRoleDTO } from '../types';
import { RoleService } from '../services/roleService';

export class RoleController {
  /**
   * Get current user's roles
   */
  static async getMyRoles(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const roles = await RoleService.getUserRoles(req.user.id);

      res.json({
        roles,
        is_super_admin: await RoleService.isSuperAdmin(req.user.id),
      });
    } catch (error: any) {
      console.error('Error getting user roles:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get all roles (super admin only)
   */
  static async getAllRoles(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const isSuperAdmin = await RoleService.isSuperAdmin(req.user.id);
      if (!isSuperAdmin) {
        res.status(403).json({ error: 'Super admin access required' });
        return;
      }

      const roles = await RoleService.getAllRoles();
      res.json({ roles });
    } catch (error: any) {
      console.error('Error getting all roles:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Assign role to user (super admin only)
   */
  static async assignRole(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const isSuperAdmin = await RoleService.isSuperAdmin(req.user.id);
      if (!isSuperAdmin) {
        res.status(403).json({ error: 'Super admin access required' });
        return;
      }

      const { user_email, role_name, community_id } = req.body as AssignRoleDTO;

      if (!user_email || !role_name) {
        res.status(400).json({ error: 'user_email and role_name are required' });
        return;
      }

      // Validate that community_id is provided for community_manager role
      if (role_name === 'community_manager' && !community_id) {
        res.status(400).json({
          error: 'community_id is required for community_manager role',
        });
        return;
      }

      const assignment = await RoleService.assignRole(
        user_email,
        role_name,
        req.user.id,
        community_id
      );

      res.json({
        message: 'Role assigned successfully',
        assignment,
      });
    } catch (error: any) {
      console.error('Error assigning role:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Remove role from user (super admin only)
   */
  static async removeRole(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const isSuperAdmin = await RoleService.isSuperAdmin(req.user.id);
      if (!isSuperAdmin) {
        res.status(403).json({ error: 'Super admin access required' });
        return;
      }

      const { user_id, role_name, community_id } = req.body;

      if (!user_id || !role_name) {
        res.status(400).json({ error: 'user_id and role_name are required' });
        return;
      }

      await RoleService.removeRole(user_id, role_name, community_id);

      res.json({ message: 'Role removed successfully' });
    } catch (error: any) {
      console.error('Error removing role:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get community managers for a community
   */
  static async getCommunityManagers(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const { communityId } = req.params;

      if (!communityId) {
        res.status(400).json({ error: 'communityId is required' });
        return;
      }

      // Check if user has access (super admin or community manager)
      const isSuperAdmin = await RoleService.isSuperAdmin(req.user.id);
      const isManager = await RoleService.isCommunityManager(
        req.user.id,
        communityId
      );

      if (!isSuperAdmin && !isManager) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const managers = await RoleService.getCommunityManagers(communityId);

      res.json({ managers });
    } catch (error: any) {
      console.error('Error getting community managers:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get communities managed by current user
   */
  static async getManagedCommunities(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const communities = await RoleService.getManagedCommunities(req.user.id);

      res.json({ communities });
    } catch (error: any) {
      console.error('Error getting managed communities:', error);
      res.status(500).json({ error: error.message });
    }
  }
}
