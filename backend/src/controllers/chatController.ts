import { Response } from 'express';
import { supabase } from '../config/database';
import { AuthRequest } from '../types';

// Get user's community chats
export const getUserCommunityChats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get all communities the user is a member of
    const { data: memberships, error: memberError } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', userId);

    if (memberError) {
      console.error('Error fetching user memberships:', memberError);
      return res.status(500).json({ error: 'Failed to fetch user memberships' });
    }

    if (!memberships || memberships.length === 0) {
      return res.json({ chats: [] });
    }

    const communityIds = memberships.map(m => m.community_id);

    // Get community details with last message info - only parent communities
    const { data: communities, error: commError } = await supabase
      .from('communities')
      .select('id, name, profile_image, parent_community_id')
      .in('id', communityIds)
      .is('parent_community_id', null);

    if (commError) {
      console.error('Error fetching communities:', commError);
      return res.status(500).json({ error: 'Failed to fetch communities' });
    }

    // Get last message for each community
    const chatsWithLastMessage = await Promise.all(
      (communities || []).map(async (community) => {
        const { data: lastMessage } = await supabase
          .from('community_messages')
          .select('content, created_at, sender_id, users:sender_id(name)')
          .eq('community_id', community.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get member count
        const { count: memberCount } = await supabase
          .from('community_members')
          .select('*', { count: 'exact', head: true })
          .eq('community_id', community.id);

        return {
          community_id: community.id,
          community_name: community.name,
          community_profile_image: community.profile_image,
          parent_community_id: community.parent_community_id,
          member_count: memberCount || 0,
          last_message: lastMessage?.content,
          last_message_time: lastMessage?.created_at,
          last_message_sender: (lastMessage?.users as any)?.name,
        };
      })
    );

    // Sort by last message time
    chatsWithLastMessage.sort((a, b) => {
      if (!a.last_message_time) return 1;
      if (!b.last_message_time) return -1;
      return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
    });

    res.json({ chats: chatsWithLastMessage });
  } catch (error) {
    console.error('Error fetching community chats:', error);
    res.status(500).json({ error: 'Failed to fetch community chats' });
  }
};

// Get messages for a community chat
export const getCommunityMessages = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { communityId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify user is a member of the community
    const { data: membership, error: memberError } = await supabase
      .from('community_members')
      .select('*')
      .eq('user_id', userId)
      .eq('community_id', communityId)
      .single();

    if (memberError || !membership) {
      return res.status(403).json({ error: 'You are not a member of this community' });
    }

    // Get messages
    const { data: messages, error: msgError } = await supabase
      .from('community_messages')
      .select(`
        id,
        content,
        created_at,
        sender_id,
        users:sender_id(
          id,
          name,
          profile_image
        )
      `)
      .eq('community_id', communityId)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (msgError) {
      console.error('Error fetching messages:', msgError);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }

    // Format messages
    const formattedMessages = (messages || []).map(msg => ({
      id: msg.id,
      community_id: communityId,
      sender_id: msg.sender_id,
      sender_name: (msg.users as any)?.name,
      sender_profile_image: (msg.users as any)?.profile_image,
      content: msg.content,
      created_at: msg.created_at,
    }));

    // Return in chronological order (oldest first)
    res.json({ messages: formattedMessages.reverse() });
  } catch (error) {
    console.error('Error fetching community messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Send a message to a community chat
export const sendCommunityMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { communityId } = req.params;
    const { content } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Verify user is a member of the community
    const { data: membership, error: memberError } = await supabase
      .from('community_members')
      .select('*')
      .eq('user_id', userId)
      .eq('community_id', communityId)
      .single();

    if (memberError || !membership) {
      return res.status(403).json({ error: 'You are not a member of this community' });
    }

    // Insert the message
    const { data: message, error: insertError } = await supabase
      .from('community_messages')
      .insert({
        community_id: communityId,
        sender_id: userId,
        content: content.trim(),
      })
      .select(`
        id,
        content,
        created_at,
        sender_id,
        community_id
      `)
      .single();

    if (insertError) {
      console.error('Error inserting message:', insertError);
      return res.status(500).json({ error: 'Failed to send message' });
    }

    // Get sender info
    const { data: user } = await supabase
      .from('users')
      .select('name, profile_image')
      .eq('id', userId)
      .single();

    const formattedMessage = {
      ...message,
      sender_name: user?.name,
      sender_profile_image: user?.profile_image,
    };

    res.status(201).json({ message: formattedMessage });
  } catch (error) {
    console.error('Error sending community message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};
