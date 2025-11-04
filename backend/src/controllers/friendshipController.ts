import { Response } from 'express';
import { AuthRequest } from '../types';
import { supabase } from '../config/database';
import { sendNotificationToUser } from '../services/notificationService';

// Send a friend request
export const sendFriendRequest = async (req: AuthRequest, res: Response) => {
  try {
    const requesterId = req.user!.id;
    const { addresseeId } = req.body;

    if (!addresseeId) {
      return res.status(400).json({ error: 'Addressee ID is required' });
    }

    if (requesterId === addresseeId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if friendship already exists
    const { data: existing } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(requester_id.eq.${requesterId},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${requesterId})`)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Friend request already exists' });
    }

    // Create friendship request
    const { data, error } = await supabase
      .from('friendships')
      .insert({
        requester_id: requesterId,
        addressee_id: addresseeId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    // Get requester's name for the notification
    const { data: requester, error: requesterError } = await supabase
      .from('users')
      .select('name')
      .eq('id', requesterId)
      .single();

    if (!requesterError && requester) {
      // Send notification to the addressee
      await sendNotificationToUser(
        addresseeId,
        'New Friend Request',
        `${requester.name} sent you a friend request`,
        { type: 'friend_request', friendshipId: data.id, requesterId }
      );
    }

    res.status(201).json({ friendship: data });
  } catch (error: any) {
    console.error('Send friend request error:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
};

// Accept a friend request
export const acceptFriendRequest = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { friendshipId } = req.params;

    // Verify the request is addressed to this user
    const { data: friendship, error: fetchError } = await supabase
      .from('friendships')
      .select('*')
      .eq('id', friendshipId)
      .eq('addressee_id', userId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !friendship) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    // Update status to accepted
    const { data, error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)
      .select()
      .single();

    if (error) throw error;

    res.json({ friendship: data });
  } catch (error: any) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ error: 'Failed to accept friend request' });
  }
};

// Reject a friend request
export const rejectFriendRequest = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { friendshipId } = req.params;

    // Verify the request is addressed to this user
    const { data: friendship, error: fetchError } = await supabase
      .from('friendships')
      .select('*')
      .eq('id', friendshipId)
      .eq('addressee_id', userId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !friendship) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    // Delete the friendship request
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (error) throw error;

    res.json({ message: 'Friend request rejected' });
  } catch (error: any) {
    console.error('Reject friend request error:', error);
    res.status(500).json({ error: 'Failed to reject friend request' });
  }
};

// Remove/unfriend a friend
export const removeFriend = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { friendshipId } = req.params;

    // Verify the user is part of this friendship
    const { data: friendship, error: fetchError } = await supabase
      .from('friendships')
      .select('*')
      .eq('id', friendshipId)
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .single();

    if (fetchError || !friendship) {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    // Delete the friendship
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (error) throw error;

    res.json({ message: 'Friend removed successfully' });
  } catch (error: any) {
    console.error('Remove friend error:', error);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
};

// Get all friends (accepted friendships)
export const getFriends = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get all accepted friendships where user is either requester or addressee
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select(`
        *,
        requester:users!friendships_requester_id_fkey(id, name, profile_image, skill_level),
        addressee:users!friendships_addressee_id_fkey(id, name, profile_image, skill_level)
      `)
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (error) throw error;

    // Map to return the friend (not the current user)
    const friends = friendships?.map((f: any) => ({
      friendshipId: f.id,
      friend: f.requester_id === userId ? f.addressee : f.requester,
      since: f.created_at
    })) || [];

    res.json({ friends });
  } catch (error: any) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Failed to get friends' });
  }
};

// Get pending friend requests (received)
export const getPendingRequests = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const { data: requests, error } = await supabase
      .from('friendships')
      .select(`
        *,
        requester:users!friendships_requester_id_fkey(id, name, profile_image, skill_level)
      `)
      .eq('addressee_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ requests: requests || [] });
  } catch (error: any) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ error: 'Failed to get pending requests' });
  }
};

// Get sent friend requests
export const getSentRequests = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const { data: requests, error } = await supabase
      .from('friendships')
      .select(`
        *,
        addressee:users!friendships_addressee_id_fkey(id, name, profile_image, skill_level)
      `)
      .eq('requester_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ requests: requests || [] });
  } catch (error: any) {
    console.error('Get sent requests error:', error);
    res.status(500).json({ error: 'Failed to get sent requests' });
  }
};

// Get suggested friends (members from user's communities)
export const getSuggestedFriends = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get user's communities
    const { data: userCommunities, error: commError } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', userId);

    if (commError) throw commError;

    const communityIds = userCommunities?.map(cm => cm.community_id) || [];

    if (communityIds.length === 0) {
      return res.json({ suggestions: [] });
    }

    // Get all members from these communities (excluding self)
    const { data: members, error: membersError } = await supabase
      .from('community_members')
      .select(`
        user_id,
        users:user_id(id, name, profile_image, skill_level, location)
      `)
      .in('community_id', communityIds)
      .neq('user_id', userId);

    if (membersError) throw membersError;

    // Get existing friendships to filter out
    const { data: friendships, error: friendError } = await supabase
      .from('friendships')
      .select('requester_id, addressee_id')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

    if (friendError) throw friendError;

    // Create a set of user IDs who are already friends or have pending requests
    const connectedUserIds = new Set<string>();
    friendships?.forEach((f: any) => {
      connectedUserIds.add(f.requester_id);
      connectedUserIds.add(f.addressee_id);
    });
    connectedUserIds.add(userId); // Exclude self

    // Filter out duplicates and already connected users
    const uniqueUsers = new Map();
    members?.forEach((m: any) => {
      if (m.users && !connectedUserIds.has(m.users.id)) {
        uniqueUsers.set(m.users.id, m.users);
      }
    });

    const suggestions = Array.from(uniqueUsers.values());

    res.json({ suggestions });
  } catch (error: any) {
    console.error('Get suggested friends error:', error);
    res.status(500).json({ error: 'Failed to get suggested friends' });
  }
};

// Check friendship status with a user
export const getFriendshipStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { userId: otherUserId } = req.params;

    const { data: friendship, error } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(requester_id.eq.${userId},addressee_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},addressee_id.eq.${userId})`)
      .maybeSingle();

    if (error) throw error;

    if (!friendship) {
      return res.json({ status: 'none', friendship: null });
    }

    let status = friendship.status;
    let direction = null;

    if (friendship.status === 'pending') {
      direction = friendship.requester_id === userId ? 'sent' : 'received';
    }

    res.json({ status, direction, friendship });
  } catch (error: any) {
    console.error('Get friendship status error:', error);
    res.status(500).json({ error: 'Failed to get friendship status' });
  }
};
