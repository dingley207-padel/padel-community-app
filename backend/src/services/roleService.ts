import { supabase } from '../config/database';
import { Role, UserRoleAssignment } from '../types';

export class RoleService {
  /**
   * Get all user roles for a specific user
   */
  static async getUserRoles(userId: string): Promise<{
    role_name: string;
    community_id: string | null;
    community_name: string | null;
  }[]> {
    const { data, error } = await supabase
      .rpc('get_user_roles', { p_user_id: userId });

    if (error) {
      throw new Error(`Failed to get user roles: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Check if user has a specific role
   */
  static async hasRole(
    userId: string,
    roleName: string,
    communityId?: string
  ): Promise<boolean> {
    const roles = await this.getUserRoles(userId);

    return roles.some(r =>
      r.role_name === roleName &&
      (communityId === undefined || r.community_id === communityId)
    );
  }

  /**
   * Check if user is super admin
   */
  static async isSuperAdmin(userId: string): Promise<boolean> {
    return this.hasRole(userId, 'super_admin');
  }

  /**
   * Check if user is community manager for a specific community
   */
  static async isCommunityManager(
    userId: string,
    communityId: string
  ): Promise<boolean> {
    return this.hasRole(userId, 'community_manager', communityId);
  }

  /**
   * Check if user is community owner for a specific community
   */
  static async isCommunityOwner(
    userId: string,
    communityId: string
  ): Promise<boolean> {
    return this.hasRole(userId, 'community_owner', communityId);
  }

  /**
   * Check if user can manage a community (owner, manager, or super admin)
   */
  static async canManageCommunity(
    userId: string,
    communityId: string
  ): Promise<boolean> {
    const isSuperAdmin = await this.isSuperAdmin(userId);
    const isOwner = await this.isCommunityOwner(userId, communityId);
    const isManager = await this.isCommunityManager(userId, communityId);

    return isSuperAdmin || isOwner || isManager;
  }

  /**
   * Get all roles
   */
  static async getAllRoles(): Promise<Role[]> {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(`Failed to get roles: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Assign role to a user
   */
  static async assignRole(
    userEmail: string,
    roleName: string,
    assignedBy: string,
    communityId?: string
  ): Promise<UserRoleAssignment> {
    // Get user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (userError || !user) {
      throw new Error(`User not found: ${userEmail}`);
    }

    // Get role by name
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', roleName)
      .single();

    if (roleError || !role) {
      throw new Error(`Role not found: ${roleName}`);
    }

    // Check if role assignment already exists
    const { data: existing } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
      .eq('role_id', role.id)
      .eq('community_id', communityId || null)
      .single();

    if (existing) {
      return existing;
    }

    // Assign role
    const { data: assignment, error: assignError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role_id: role.id,
        community_id: communityId || null,
        assigned_by: assignedBy,
      })
      .select()
      .single();

    if (assignError || !assignment) {
      throw new Error(`Failed to assign role: ${assignError?.message}`);
    }

    return assignment;
  }

  /**
   * Remove role from user
   */
  static async removeRole(
    userId: string,
    roleName: string,
    communityId?: string
  ): Promise<void> {
    // Get role by name
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', roleName)
      .single();

    if (roleError || !role) {
      throw new Error(`Role not found: ${roleName}`);
    }

    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', role.id)
      .eq('community_id', communityId || null);

    if (deleteError) {
      throw new Error(`Failed to remove role: ${deleteError.message}`);
    }
  }

  /**
   * Get all community managers for a community
   */
  static async getCommunityManagers(communityId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        id,
        user_id,
        assigned_at,
        assigned_by,
        users!user_roles_user_id_fkey(id, name, email, phone, profile_image),
        roles!inner(name),
        assigned_by_user:users!user_roles_assigned_by_fkey(name)
      `)
      .eq('community_id', communityId)
      .in('roles.name', ['community_manager', 'community_owner']);

    if (error) {
      throw new Error(`Failed to get community managers: ${error.message}`);
    }

    // Transform data to flatten user information
    return (data || []).map((item: any) => ({
      id: item.id,
      user_id: item.users.id,
      user_name: item.users.name,
      user_email: item.users.email,
      user_phone: item.users.phone,
      user_profile_image: item.users.profile_image,
      role_name: item.roles.name,
      assigned_at: item.assigned_at,
      assigned_by: item.assigned_by,
      assigned_by_name: item.assigned_by_user?.name,
    }));
  }

  /**
   * Assign community manager role (only owners and super admins can do this)
   */
  static async assignCommunityManager(
    communityId: string,
    targetUserId: string,
    assignedByUserId: string
  ): Promise<void> {
    // Check if assigner is owner or super admin
    const isOwner = await this.isCommunityOwner(assignedByUserId, communityId);
    const isSuperAdm = await this.isSuperAdmin(assignedByUserId);

    if (!isOwner && !isSuperAdm) {
      throw new Error('Only community owners or super admins can assign managers');
    }

    // Check if target user exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', targetUserId)
      .single();

    if (userError || !userData) {
      throw new Error('Target user not found');
    }

    // Get community_manager role ID
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'community_manager')
      .single();

    if (roleError || !roleData) {
      throw new Error('Community manager role not found');
    }

    // Check if user already has this role
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', targetUserId)
      .eq('role_id', roleData.id)
      .eq('community_id', communityId)
      .single();

    if (existingRole) {
      throw new Error('User is already a manager of this community');
    }

    // Assign the role
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: targetUserId,
        role_id: roleData.id,
        community_id: communityId,
        assigned_by: assignedByUserId,
      });

    if (insertError) {
      console.error('[assignCommunityManager] Error:', insertError);
      throw new Error(`Failed to assign manager role: ${insertError.message}`);
    }

    console.log(`[assignCommunityManager] Assigned ${targetUserId} as manager of community ${communityId}`);
  }

  /**
   * Revoke community manager role (only owners and super admins can do this)
   */
  static async revokeCommunityManager(
    communityId: string,
    targetUserId: string,
    revokedByUserId: string
  ): Promise<void> {
    // Check if revoker is owner or super admin
    const isOwner = await this.isCommunityOwner(revokedByUserId, communityId);
    const isSuperAdm = await this.isSuperAdmin(revokedByUserId);

    if (!isOwner && !isSuperAdm) {
      throw new Error('Only community owners or super admins can revoke manager roles');
    }

    // Prevent revoking owner role (only super admin can do that)
    const { data: targetRoles } = await supabase
      .from('user_roles')
      .select('roles!inner(name)')
      .eq('user_id', targetUserId)
      .eq('community_id', communityId);

    const isTargetOwner = targetRoles?.some((ur: any) => ur.roles?.name === 'community_owner');

    if (isTargetOwner && !isSuperAdm) {
      throw new Error('Only super admins can revoke community owner roles');
    }

    // Get community_manager role ID
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'community_manager')
      .single();

    if (roleError || !roleData) {
      throw new Error('Community manager role not found');
    }

    // Remove the role
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', targetUserId)
      .eq('role_id', roleData.id)
      .eq('community_id', communityId);

    if (deleteError) {
      console.error('[revokeCommunityManager] Error:', deleteError);
      throw new Error(`Failed to revoke manager role: ${deleteError.message}`);
    }

    console.log(`[revokeCommunityManager] Revoked manager role from ${targetUserId} for community ${communityId}`);
  }

  /**
   * Search users by email or phone to add as managers
   */
  static async searchUsersForManager(
    searchTerm: string,
    communityId: string,
    requestingUserId: string
  ): Promise<Array<{ id: string; name: string; email?: string; phone?: string }>> {
    // Check if requesting user is owner or super admin
    const isOwner = await this.isCommunityOwner(requestingUserId, communityId);
    const isSuperAdm = await this.isSuperAdmin(requestingUserId);

    if (!isOwner && !isSuperAdm) {
      throw new Error('Insufficient permissions to search users');
    }

    // Search users by email or phone
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, phone')
      .or(`email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
      .limit(10);

    if (error) {
      console.error('[searchUsersForManager] Error:', error);
      throw new Error(`Failed to search users: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get all communities managed by a user
   */
  static async getManagedCommunities(userId: string): Promise<any[]> {
    console.log('🔍 [RoleService.getManagedCommunities] Called for userId:', userId);

    // Check if user is super admin
    const isSuperAdmin = await this.isSuperAdmin(userId);
    console.log('👑 [RoleService.getManagedCommunities] Is super admin:', isSuperAdmin);

    // Super admins get all parent communities (not sub-communities)
    if (isSuperAdmin) {
      const { data, error } = await supabase
        .from('communities')
        .select('id, name, description, location, profile_image')
        .is('parent_community_id', null)
        .order('name');

      if (error) {
        throw new Error(`Failed to get all communities: ${error.message}`);
      }

      console.log('📦 [RoleService.getManagedCommunities] Super admin communities count:', data?.length || 0);
      console.log('🏘️ [RoleService.getManagedCommunities] Returning communities:', JSON.stringify(data, null, 2));
      return data || [];
    }

    // Regular community managers and owners get their assigned parent communities (not sub-communities)
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        community_id,
        communities!inner(id, name, description, location, profile_image, parent_community_id),
        roles!inner(name)
      `)
      .eq('user_id', userId)
      .in('roles.name', ['community_manager', 'community_owner'])
      .not('community_id', 'is', null);

    if (error) {
      throw new Error(`Failed to get managed communities: ${error.message}`);
    }

    console.log('📊 [RoleService.getManagedCommunities] Raw query result count:', data?.length || 0);

    // Filter to only return parent communities (where parent_community_id is null)
    const communities = data?.map(d => d.communities) || [];
    const filteredCommunities = communities.filter((c: any) => c.parent_community_id === null);

    console.log('✅ [RoleService.getManagedCommunities] After filtering, returning count:', filteredCommunities.length);
    console.log('🏘️ [RoleService.getManagedCommunities] Returning communities:', JSON.stringify(filteredCommunities, null, 2));

    return filteredCommunities;
  }
}
