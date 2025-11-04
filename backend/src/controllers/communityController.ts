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
} from '../services/communityService';
import { sendNotificationToMultipleUsers } from '../services/notificationService';
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
    const { title, message } = req.body;

    if (!title || !message) {
      res.status(400).json({ error: 'Title and message are required' });
      return;
    }

    // Verify user is a manager of this community
    const { data: role, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', req.user.id)
      .eq('community_id', communityId)
      .in('role', ['community_manager', 'super_admin'])
      .single();

    if (roleError || !role) {
      res.status(403).json({ error: 'You do not have permission to send notifications for this community' });
      return;
    }

    // Get all members of the community
    const { data: members, error: membersError } = await supabase
      .from('community_members')
      .select('user_id')
      .eq('community_id', communityId);

    if (membersError || !members || members.length === 0) {
      res.status(404).json({ error: 'No members found in this community' });
      return;
    }

    // Extract user IDs
    const userIds = members.map(m => m.user_id);

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
