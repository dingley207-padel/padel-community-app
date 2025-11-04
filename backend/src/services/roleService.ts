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
        assigned_at,
        users!user_roles_user_id_fkey(id, name, email, profile_image),
        roles!inner(name)
      `)
      .eq('community_id', communityId)
      .eq('roles.name', 'community_manager');

    if (error) {
      throw new Error(`Failed to get community managers: ${error.message}`);
    }

    // Transform data to flatten user information
    return (data || []).map((item: any) => ({
      user_id: item.users.id,
      user_name: item.users.name,
      user_email: item.users.email,
      user_profile_image: item.users.profile_image,
      assigned_at: item.assigned_at,
    }));
  }

  /**
   * Get all communities managed by a user
   */
  static async getManagedCommunities(userId: string): Promise<any[]> {
    // Check if user is super admin
    const isSuperAdmin = await this.isSuperAdmin(userId);

    // Super admins get all communities
    if (isSuperAdmin) {
      const { data, error } = await supabase
        .from('communities')
        .select('id, name, description, location, profile_image')
        .order('name');

      if (error) {
        throw new Error(`Failed to get all communities: ${error.message}`);
      }

      return data || [];
    }

    // Regular community managers only get their assigned communities
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        community_id,
        communities!inner(id, name, description, location, profile_image),
        roles!inner(name)
      `)
      .eq('user_id', userId)
      .eq('roles.name', 'community_manager')
      .not('community_id', 'is', null);

    if (error) {
      throw new Error(`Failed to get managed communities: ${error.message}`);
    }

    return data?.map(d => d.communities) || [];
  }
}
