import { supabase } from '../config/database';
import { Community } from '../types';

export const createCommunity = async (
  managerId: string,
  communityData: {
    name: string;
    description?: string;
    location?: string;
    profile_image?: string;
    visibility?: boolean;
    parent_community_id?: string;
  }
): Promise<Community> => {
  // Note: User role is now managed through the roles system
  // Community manager role should be assigned separately via RoleService

  const { data, error } = await supabase
    .from('communities')
    .insert({
      ...communityData,
      manager_id: managerId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create community: ${error.message}`);
  }

  return data as Community;
};

export const getCommunityById = async (communityId: string): Promise<Community | null> => {
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .eq('id', communityId)
    .single();

  if (error) {
    return null;
  }

  // Get member count
  const { count } = await supabase
    .from('community_members')
    .select('*', { count: 'exact', head: true })
    .eq('community_id', communityId);

  return {
    ...data,
    member_count: count || 0,
  } as Community;
};

export const getCommunitiesByManager = async (managerId: string): Promise<Community[]> => {
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .eq('manager_id', managerId)
    .is('parent_community_id', null) // Only return parent communities
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch communities: ${error.message}`);
  }

  // Add member counts to each community
  const communitiesWithCounts = await Promise.all(
    data.map(async (community: any) => {
      const { count } = await supabase
        .from('community_members')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', community.id);

      return {
        ...community,
        member_count: count || 0,
      };
    })
  );

  return communitiesWithCounts as Community[];
};

export const updateCommunity = async (
  communityId: string,
  updates: Partial<Community>,
  managerId: string
): Promise<Community> => {
  // Verify ownership
  const { data: community } = await supabase
    .from('communities')
    .select('*')
    .eq('id', communityId)
    .eq('manager_id', managerId)
    .single();

  if (!community) {
    throw new Error('Community not found or you do not have permission');
  }

  const { data, error } = await supabase
    .from('communities')
    .update(updates)
    .eq('id', communityId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update community: ${error.message}`);
  }

  return data as Community;
};

export const joinCommunity = async (
  userId: string,
  communityId: string
): Promise<void> => {
  const { error } = await supabase
    .from('community_members')
    .insert({
      user_id: userId,
      community_id: communityId,
    });

  if (error) {
    if (error.code === '23505') { // Unique violation
      throw new Error('You are already a member of this community');
    }
    throw new Error(`Failed to join community: ${error.message}`);
  }
};

export const leaveCommunity = async (
  userId: string,
  communityId: string
): Promise<void> => {
  const { error } = await supabase
    .from('community_members')
    .delete()
    .eq('user_id', userId)
    .eq('community_id', communityId);

  if (error) {
    throw new Error(`Failed to leave community: ${error.message}`);
  }
};

export const getUserCommunities = async (userId: string): Promise<Community[]> => {
  const { data, error } = await supabase
    .from('community_members')
    .select('communities (*)')
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to fetch user communities: ${error.message}`);
  }

  const communities = data.map((item: any) => item.communities);

  // Add member counts to each community
  const communitiesWithCounts = await Promise.all(
    communities.map(async (community: any) => {
      const { count } = await supabase
        .from('community_members')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', community.id);

      return {
        ...community,
        member_count: count || 0,
      };
    })
  );

  return communitiesWithCounts as Community[];
};

export const getAllCommunities = async (limit: number = 50): Promise<Community[]> => {
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch communities: ${error.message}`);
  }

  // Add member counts to each community
  const communitiesWithCounts = await Promise.all(
    data.map(async (community: any) => {
      const { count } = await supabase
        .from('community_members')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', community.id);

      return {
        ...community,
        member_count: count || 0,
      };
    })
  );

  return communitiesWithCounts as Community[];
};

// Sub-communities functions
export const getSubCommunities = async (parentCommunityId: string): Promise<Community[]> => {
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .eq('parent_community_id', parentCommunityId)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch sub-communities: ${error.message}`);
  }

  // Add member counts to each sub-community
  const subCommunitiesWithCounts = await Promise.all(
    data.map(async (community: any) => {
      const { count } = await supabase
        .from('community_members')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', community.id);

      return {
        ...community,
        member_count: count || 0,
      };
    })
  );

  return subCommunitiesWithCounts as Community[];
};

export const createSubCommunity = async (
  managerId: string,
  parentCommunityId: string,
  subCommunityData: {
    name: string;
    description?: string;
    location?: string;
    profile_image?: string;
    banner_image?: string;
    visibility?: boolean;
  }
): Promise<Community> => {
  // Verify parent community exists and user has permission
  const { data: parentCommunity } = await supabase
    .from('communities')
    .select('*')
    .eq('id', parentCommunityId)
    .eq('manager_id', managerId)
    .single();

  if (!parentCommunity) {
    throw new Error('Parent community not found or you do not have permission');
  }

  // Verify parent community doesn't already have a parent (prevent deep nesting)
  if (parentCommunity.parent_community_id) {
    throw new Error('Cannot create sub-community under another sub-community');
  }

  return createCommunity(managerId, {
    ...subCommunityData,
    parent_community_id: parentCommunityId,
  });
};

export const joinCommunityWithSubs = async (
  userId: string,
  parentCommunityId: string,
  subCommunityIds: string[]
): Promise<void> => {
  // Join parent community
  try {
    await joinCommunity(userId, parentCommunityId);
  } catch (error: any) {
    // If already a member, that's okay, continue to join sub-communities
    if (!error.message.includes('already a member')) {
      throw error;
    }
  }

  // Join selected sub-communities
  for (const subCommunityId of subCommunityIds) {
    try {
      // Verify sub-community belongs to parent
      const { data: subCommunity } = await supabase
        .from('communities')
        .select('parent_community_id')
        .eq('id', subCommunityId)
        .single();

      if (subCommunity && subCommunity.parent_community_id === parentCommunityId) {
        await joinCommunity(userId, subCommunityId);
      }
    } catch (error: any) {
      // Continue joining other sub-communities even if one fails
      console.error(`Failed to join sub-community ${subCommunityId}:`, error.message);
    }
  }
};

export const updateSubCommunity = async (
  managerId: string,
  subCommunityId: string,
  updates: {
    name?: string;
    description?: string;
    location?: string;
    profile_image?: string;
    banner_image?: string;
    visibility?: boolean;
  }
): Promise<Community> => {
  console.log('[updateSubCommunity] Starting update:', { managerId, subCommunityId, updates });

  // Get the sub-community to verify ownership and that it's actually a sub-community
  const { data: subCommunity, error: fetchError } = await supabase
    .from('communities')
    .select('*, parent_community_id')
    .eq('id', subCommunityId)
    .single();

  if (fetchError) {
    console.error('[updateSubCommunity] Error fetching sub-community:', fetchError);
    throw new Error(`Failed to fetch sub-community: ${fetchError.message}`);
  }

  if (!subCommunity) {
    console.error('[updateSubCommunity] Sub-community not found:', subCommunityId);
    throw new Error('Sub-community not found');
  }

  // Verify it's actually a sub-community (has a parent)
  if (!subCommunity.parent_community_id) {
    console.error('[updateSubCommunity] Attempting to update parent community:', subCommunityId);
    throw new Error('Cannot update a parent community through this endpoint');
  }

  // Verify ownership by checking the parent community's manager
  const { data: parentCommunity, error: parentError } = await supabase
    .from('communities')
    .select('manager_id')
    .eq('id', subCommunity.parent_community_id)
    .single();

  if (parentError) {
    console.error('[updateSubCommunity] Error fetching parent community:', parentError);
    throw new Error(`Failed to fetch parent community: ${parentError.message}`);
  }

  if (!parentCommunity) {
    console.error('[updateSubCommunity] Parent community not found:', subCommunity.parent_community_id);
    throw new Error('Parent community not found');
  }

  if (parentCommunity.manager_id !== managerId) {
    console.error('[updateSubCommunity] Permission denied');
    throw new Error('You do not have permission to update this sub-community');
  }

  // Update the sub-community
  console.log('[updateSubCommunity] Updating sub-community:', subCommunityId);
  const { data: updatedSubCommunity, error: updateError } = await supabase
    .from('communities')
    .update(updates)
    .eq('id', subCommunityId)
    .select()
    .single();

  if (updateError) {
    console.error('[updateSubCommunity] Update error:', updateError);
    throw new Error(`Failed to update sub-community: ${updateError.message}`);
  }

  console.log('[updateSubCommunity] Successfully updated sub-community');
  return updatedSubCommunity as Community;
};

export const deleteSubCommunity = async (
  managerId: string,
  subCommunityId: string
): Promise<void> => {
  console.log('[deleteSubCommunity] Starting deletion:', { managerId, subCommunityId });

  // Get the sub-community to verify ownership and that it's actually a sub-community
  const { data: subCommunity, error: fetchError } = await supabase
    .from('communities')
    .select('*, parent_community_id')
    .eq('id', subCommunityId)
    .single();

  if (fetchError) {
    console.error('[deleteSubCommunity] Error fetching sub-community:', fetchError);
    throw new Error(`Failed to fetch sub-community: ${fetchError.message}`);
  }

  if (!subCommunity) {
    console.error('[deleteSubCommunity] Sub-community not found:', subCommunityId);
    throw new Error('Sub-community not found');
  }

  console.log('[deleteSubCommunity] Found sub-community:', {
    id: subCommunity.id,
    name: subCommunity.name,
    parent_id: subCommunity.parent_community_id,
  });

  // Verify it's actually a sub-community (has a parent)
  if (!subCommunity.parent_community_id) {
    console.error('[deleteSubCommunity] Attempting to delete parent community:', subCommunityId);
    throw new Error('Cannot delete a parent community through this endpoint');
  }

  // Verify ownership by checking the parent community's manager
  const { data: parentCommunity, error: parentError } = await supabase
    .from('communities')
    .select('manager_id')
    .eq('id', subCommunity.parent_community_id)
    .single();

  if (parentError) {
    console.error('[deleteSubCommunity] Error fetching parent community:', parentError);
    throw new Error(`Failed to fetch parent community: ${parentError.message}`);
  }

  if (!parentCommunity) {
    console.error('[deleteSubCommunity] Parent community not found:', subCommunity.parent_community_id);
    throw new Error('Parent community not found');
  }

  console.log('[deleteSubCommunity] Checking permissions:', {
    parentManagerId: parentCommunity.manager_id,
    requestingManagerId: managerId,
    match: parentCommunity.manager_id === managerId,
  });

  if (parentCommunity.manager_id !== managerId) {
    console.error('[deleteSubCommunity] Permission denied');
    throw new Error('You do not have permission to delete this sub-community');
  }

  // Delete the sub-community (cascade will handle community_members)
  console.log('[deleteSubCommunity] Deleting sub-community:', subCommunityId);
  const { error: deleteError } = await supabase
    .from('communities')
    .delete()
    .eq('id', subCommunityId);

  if (deleteError) {
    console.error('[deleteSubCommunity] Delete error:', deleteError);
    throw new Error(`Failed to delete sub-community: ${deleteError.message}`);
  }

  console.log('[deleteSubCommunity] Successfully deleted sub-community:', subCommunityId);
};

export const joinSubCommunity = async (
  userId: string,
  parentCommunityId: string,
  subCommunityId: string
): Promise<void> => {
  // Verify sub-community belongs to parent
  const { data: subCommunity } = await supabase
    .from('communities')
    .select('parent_community_id')
    .eq('id', subCommunityId)
    .single();

  if (!subCommunity || subCommunity.parent_community_id !== parentCommunityId) {
    throw new Error('Sub-community not found or does not belong to this community');
  }

  // Use the existing joinCommunity function (it works for both parent and sub-communities)
  await joinCommunity(userId, subCommunityId);
};

export const leaveSubCommunity = async (
  userId: string,
  parentCommunityId: string,
  subCommunityId: string
): Promise<void> => {
  // Verify sub-community belongs to parent
  const { data: subCommunity } = await supabase
    .from('communities')
    .select('parent_community_id')
    .eq('id', subCommunityId)
    .single();

  if (!subCommunity || subCommunity.parent_community_id !== parentCommunityId) {
    throw new Error('Sub-community not found or does not belong to this community');
  }

  // Use the existing leaveCommunity function
  await leaveCommunity(userId, subCommunityId);
};
