import { Response } from 'express';
import { AuthRequest } from '../types';
import { supabase } from '../config/database';

// Get announcements from user's joined communities
export const getMyAnnouncements = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    console.log('[getMyAnnouncements] Starting for user:', userId);

    // First, get the community IDs where the user is a member
    console.log('[getMyAnnouncements] Fetching community memberships...');
    const { data: memberships, error: membershipError } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', userId);

    if (membershipError) {
      console.error('[getMyAnnouncements] Membership error:', membershipError);
      throw membershipError;
    }

    console.log('[getMyAnnouncements] Found memberships:', memberships?.length || 0);

    if (!memberships || memberships.length === 0) {
      console.log('[getMyAnnouncements] No memberships, returning empty array');
      res.json({ announcements: [] });
      return;
    }

    const communityIds = memberships.map(m => m.community_id);
    console.log('[getMyAnnouncements] Community IDs:', communityIds);

    // Get announcements from those communities
    console.log('[getMyAnnouncements] Fetching announcements...');
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select(`
        id,
        community_id,
        title,
        message,
        created_by,
        created_at,
        updated_at,
        communities:community_id (
          id,
          name,
          profile_image
        ),
        users:created_by (
          id,
          name,
          profile_image
        )
      `)
      .in('community_id', communityIds)
      .order('created_at', { ascending: false })
      .limit(50);

    console.log('[getMyAnnouncements] Query completed');

    if (error) {
      console.error('[getMyAnnouncements] Announcements error:', error);
      throw error;
    }

    console.log('[getMyAnnouncements] Found announcements:', announcements?.length || 0);
    res.json({ announcements: announcements || [] });
  } catch (error: any) {
    console.error('Get my announcements error:', error);
    res.status(500).json({ error: 'Failed to get announcements' });
  }
};

// Get announcements for a specific community (for community managers)
export const getCommunityAnnouncements = async (req: AuthRequest, res: Response) => {
  try {
    const { communityId } = req.params;

    const { data: announcements, error } = await supabase
      .from('announcements')
      .select(`
        *,
        communities:community_id (
          id,
          name,
          profile_image
        ),
        users:created_by (
          id,
          name,
          profile_image
        )
      `)
      .eq('community_id', communityId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ announcements: announcements || [] });
  } catch (error: any) {
    console.error('Get community announcements error:', error);
    res.status(500).json({ error: 'Failed to get community announcements' });
  }
};

// Create a new announcement (community managers and super admins)
export const createAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { community_id, title, message } = req.body;

    if (!community_id || !title || !message) {
      return res.status(400).json({ error: 'Community ID, title, and message are required' });
    }

    // Create the announcement
    const { data: announcement, error } = await supabase
      .from('announcements')
      .insert({
        community_id,
        title,
        message,
        created_by: userId,
      })
      .select(`
        *,
        communities:community_id (
          id,
          name,
          profile_image
        ),
        users:created_by (
          id,
          name,
          profile_image
        )
      `)
      .single();

    if (error) throw error;

    res.status(201).json({ announcement });
  } catch (error: any) {
    console.error('Create announcement error:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
};

// Update an announcement
export const updateAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { announcementId } = req.params;
    const { title, message } = req.body;

    // Verify the user created this announcement
    const { data: existing, error: fetchError } = await supabase
      .from('announcements')
      .select('created_by')
      .eq('id', announcementId)
      .single();

    if (fetchError) throw fetchError;

    if (!existing) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (existing.created_by !== userId && req.user!.role !== 'super_admin') {
      return res.status(403).json({ error: 'Not authorized to update this announcement' });
    }

    // Update the announcement
    const updateData: any = {};
    if (title) updateData.title = title;
    if (message) updateData.message = message;

    const { data: announcement, error } = await supabase
      .from('announcements')
      .update(updateData)
      .eq('id', announcementId)
      .select(`
        *,
        communities:community_id (
          id,
          name,
          profile_image
        ),
        users:created_by (
          id,
          name,
          profile_image
        )
      `)
      .single();

    if (error) throw error;

    res.json({ announcement });
  } catch (error: any) {
    console.error('Update announcement error:', error);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
};

// Delete an announcement
export const deleteAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { announcementId } = req.params;

    // Verify the user created this announcement
    const { data: existing, error: fetchError } = await supabase
      .from('announcements')
      .select('created_by')
      .eq('id', announcementId)
      .single();

    if (fetchError) throw fetchError;

    if (!existing) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (existing.created_by !== userId && req.user!.role !== 'super_admin') {
      return res.status(403).json({ error: 'Not authorized to delete this announcement' });
    }

    // Delete the announcement
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', announcementId);

    if (error) throw error;

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error: any) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
};
