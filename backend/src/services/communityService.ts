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
