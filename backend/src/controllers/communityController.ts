import { Response } from 'express';
import {
  createCommunity,
  getCommunityById,
  getCommunitiesByManager,
  updateCommunity,
  joinCommunity,
  leaveCommunity,
  getUserCommunities,
  getAllCommunities,
  getSubCommunities,
  createSubCommunity,
  updateSubCommunity,
  joinCommunityWithSubs,
  deleteSubCommunity,
  joinSubCommunity,
  leaveSubCommunity,
} from '../services/communityService';
import { sendNotificationToMultipleUsers } from '../services/notificationService';
import { RoleService } from '../services/roleService';
import { supabase } from '../config/database';
import { AuthRequest } from '../types';

export const createCommunityHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const community = await createCommunity(req.user.id, req.body);

    res.status(201).json({
      message: 'Community created successfully',
      community,
    });
  } catch (error: any) {
    console.error('Create community error:', error);
    res.status(400).json({ error: error.message || 'Failed to create community' });
  }
};

export const getCommunityHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const community = await getCommunityById(id);

    if (!community) {
      res.status(404).json({ error: 'Community not found' });
      return;
    }

    res.status(200).json({ community });
  } catch (error: any) {
    console.error('Get community error:', error);
    res.status(500).json({ error: 'Failed to fetch community' });
  }
};

export const getManagerCommunitiesHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const communities = await getCommunitiesByManager(req.user.id);

    res.status(200).json({ communities });
  } catch (error: any) {
    console.error('Get manager communities error:', error);
    res.status(500).json({ error: 'Failed to fetch communities' });
  }
};

export const updateCommunityHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const updates = req.body;

    // Prevent updating certain fields
    delete updates.id;
    delete updates.manager_id;
    delete updates.created_at;
    delete updates.updated_at;

    const community = await updateCommunity(id, updates, req.user.id);

    res.status(200).json({
      message: 'Community updated successfully',
      community,
    });
  } catch (error: any) {
    console.error('Update community error:', error);
    res.status(400).json({ error: error.message || 'Failed to update community' });
  }
};

export const joinCommunityHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;

    await joinCommunity(req.user.id, id);

    res.status(200).json({
      message: 'Joined community successfully',
    });
  } catch (error: any) {
    console.error('Join community error:', error);
    res.status(400).json({ error: error.message || 'Failed to join community' });
  }
};

export const leaveCommunityHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;

    await leaveCommunity(req.user.id, id);

    res.status(200).json({
      message: 'Left community successfully',
    });
  } catch (error: any) {
    console.error('Leave community error:', error);
    res.status(400).json({ error: error.message || 'Failed to leave community' });
  }
};

export const getUserCommunitiesHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const communities = await getUserCommunities(req.user.id);

    res.status(200).json({ communities });
  } catch (error: any) {
    console.error('Get user communities error:', error);
    res.status(500).json({ error: 'Failed to fetch communities' });
  }
};

export const getAllCommunitiesHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { limit } = req.query;

    const communities = await getAllCommunities(
      limit ? parseInt(limit as string) : 50
    );

    res.status(200).json({ communities });
  } catch (error: any) {
    console.error('Get all communities error:', error);
    res.status(500).json({ error: 'Failed to fetch communities' });
  }
};

export const sendCommunityNotificationHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id: communityId } = req.params;
    const { title, message, sub_community_ids = [], include_parent = false } = req.body;

    if (!title || !message) {
      res.status(400).json({ error: 'Title and message are required' });
      return;
    }

    // Verify user is a manager of this community
    const canManage = await RoleService.canManageCommunity(req.user.id, communityId);

    if (!canManage) {
      res.status(403).json({ error: 'You do not have permission to send notifications for this community' });
      return;
    }

    // Collect community IDs to query based on selections
    const communityIds: string[] = [];

    // Only include parent if explicitly selected
    if (include_parent) {
      communityIds.push(communityId);
      console.log('Including parent community in notification');
    }

    // Add selected sub-communities if any
    if (sub_community_ids && Array.isArray(sub_community_ids) && sub_community_ids.length > 0) {
      // Verify that all selected sub-communities belong to this parent community
      const { data: subCommunities, error: subCommError } = await supabase
        .from('communities')
        .select('id')
        .eq('parent_community_id', communityId)
        .in('id', sub_community_ids);

      if (!subCommError && subCommunities && subCommunities.length > 0) {
        const validSubIds = subCommunities.map((sc: any) => sc.id);
        communityIds.push(...validSubIds);
        console.log(`Including ${validSubIds.length} selected sub-communities in notification`);
      }
    }

    // Get all members of the community (and sub-communities if included)
    const { data: members, error: membersError } = await supabase
      .from('community_members')
      .select('user_id')
      .in('community_id', communityIds);

    if (membersError || !members || members.length === 0) {
      res.status(404).json({ error: 'No members found in this community' });
      return;
    }

    // Extract unique user IDs (in case same user is in multiple sub-communities)
    const userIds = [...new Set(members.map(m => m.user_id))];

    // Send notifications to all members
    const result = await sendNotificationToMultipleUsers(
      userIds,
      title,
      message,
      { type: 'community_notification', communityId }
    );

    console.log(`Sent notification to ${result.sent} users, failed for ${result.failed} users`);

    res.status(200).json({
      message: 'Notification sent successfully',
      sent: result.sent,
      failed: result.failed,
    });
  } catch (error: any) {
    console.error('Send community notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
};

export const getSubCommunitiesHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id: parentCommunityId } = req.params;

    console.log('[getSubCommunitiesHandler] Fetching sub-communities for parent:', parentCommunityId);
    const subCommunities = await getSubCommunities(parentCommunityId);
    console.log('[getSubCommunitiesHandler] Found sub-communities:', subCommunities.length);
    console.log('[getSubCommunitiesHandler] Sub-communities:', JSON.stringify(subCommunities, null, 2));

    res.status(200).json({ sub_communities: subCommunities });
  } catch (error: any) {
    console.error('Get sub-communities error:', error);
    res.status(500).json({ error: 'Failed to fetch sub-communities' });
  }
};

export const createSubCommunityHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id: parentCommunityId } = req.params;

    const subCommunity = await createSubCommunity(
      req.user.id,
      parentCommunityId,
      req.body
    );

    res.status(201).json({
      message: 'Sub-community created successfully',
      community: subCommunity,
    });
  } catch (error: any) {
    console.error('Create sub-community error:', error);
    res.status(400).json({ error: error.message || 'Failed to create sub-community' });
  }
};

export const updateSubCommunityHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      console.error('[updateSubCommunityHandler] No user in request');
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { subCommunityId } = req.params;

    console.log('[updateSubCommunityHandler] Request received:', {
      userId: req.user.id,
      subCommunityId,
      updates: req.body,
    });

    if (!subCommunityId) {
      console.error('[updateSubCommunityHandler] Missing subCommunityId parameter');
      res.status(400).json({ error: 'Sub-community ID is required' });
      return;
    }

    // Prevent updating certain fields
    const updates = { ...req.body };
    delete updates.id;
    delete updates.manager_id;
    delete updates.parent_community_id;
    delete updates.created_at;
    delete updates.updated_at;

    const updatedSubCommunity = await updateSubCommunity(req.user.id, subCommunityId, updates);

    console.log('[updateSubCommunityHandler] Successfully updated sub-community');
    res.status(200).json({
      message: 'Sub-community updated successfully',
      community: updatedSubCommunity,
    });
  } catch (error: any) {
    console.error('[updateSubCommunityHandler] Error:', error.message);
    res.status(400).json({ error: error.message || 'Failed to update sub-community' });
  }
};

export const deleteSubCommunityHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      console.error('[deleteSubCommunityHandler] No user in request');
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { subCommunityId } = req.params;

    console.log('[deleteSubCommunityHandler] Request received:', {
      userId: req.user.id,
      subCommunityId,
      params: req.params,
    });

    if (!subCommunityId) {
      console.error('[deleteSubCommunityHandler] Missing subCommunityId parameter');
      res.status(400).json({ error: 'Sub-community ID is required' });
      return;
    }

    await deleteSubCommunity(req.user.id, subCommunityId);

    console.log('[deleteSubCommunityHandler] Successfully deleted sub-community');
    res.status(200).json({
      message: 'Sub-community deleted successfully',
    });
  } catch (error: any) {
    console.error('[deleteSubCommunityHandler] Error:', error.message);
    res.status(400).json({ error: error.message || 'Failed to delete sub-community' });
  }
};

export const joinCommunityWithSubsHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id: parentCommunityId } = req.params;
    const { sub_community_ids } = req.body;

    if (!Array.isArray(sub_community_ids)) {
      res.status(400).json({ error: 'sub_community_ids must be an array' });
      return;
    }

    await joinCommunityWithSubs(req.user.id, parentCommunityId, sub_community_ids);

    res.status(200).json({
      message: 'Joined community and sub-communities successfully',
    });
  } catch (error: any) {
    console.error('Join community with subs error:', error);
    res.status(400).json({ error: error.message || 'Failed to join communities' });
  }
};

export const joinSubCommunityHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id: parentCommunityId, subCommunityId } = req.params;

    await joinSubCommunity(req.user.id, parentCommunityId, subCommunityId);

    res.status(200).json({
      message: 'Joined sub-community successfully',
    });
  } catch (error: any) {
    console.error('Join sub-community error:', error);
    res.status(400).json({ error: error.message || 'Failed to join sub-community' });
  }
};

export const leaveSubCommunityHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id: parentCommunityId, subCommunityId } = req.params;

    await leaveSubCommunity(req.user.id, parentCommunityId, subCommunityId);

    res.status(200).json({
      message: 'Left sub-community successfully',
    });
  } catch (error: any) {
    console.error('Leave sub-community error:', error);
    res.status(400).json({ error: error.message || 'Failed to leave sub-community' });
  }
};
