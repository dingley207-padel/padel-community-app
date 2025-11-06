import { supabase } from '../config/database';
import { Session, CreateSessionDTO } from '../types';
import { notifyNewSession } from './notificationService';

export const createSession = async (
  sessionData: CreateSessionDTO,
  managerId: string
): Promise<Session> => {
  // Verify the community exists
  const { data: community, error: communityError } = await supabase
    .from('communities')
    .select('*')
    .eq('id', sessionData.community_id)
    .single();

  if (communityError || !community) {
    throw new Error('Community not found');
  }

  // Check if user is super_admin or community_manager for this community
  console.log('[createSession] Checking permissions for user:', managerId, 'community:', sessionData.community_id);

  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('community_id, roles(name)')
    .eq('user_id', managerId);

  console.log('[createSession] User roles:', userRoles);
  console.log('[createSession] Roles query error:', rolesError);

  // Check if user is super_admin OR community_manager for this specific community
  const hasPermission = userRoles && userRoles.some((ur: any) =>
    ur.roles?.name === 'super_admin' ||
    (ur.roles?.name === 'community_manager' && ur.community_id === sessionData.community_id)
  );

  if (!hasPermission) {
    console.log('[createSession] Permission denied for user:', managerId);
    throw new Error('Insufficient permissions to create session for this community');
  }

  console.log('[createSession] Permission granted, creating session');

  const { data, error} = await supabase
    .from('sessions')
    .insert({
      ...sessionData,
      datetime: new Date(sessionData.datetime).toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }

  const newSession = data as Session;

  // Create an announcement for the new session
  try {
    await supabase
      .from('announcements')
      .insert({
        community_id: sessionData.community_id,
        title: community.name,
        message: `New Match: ${sessionData.title} - ${sessionData.location}`,
        created_by: managerId,
      });
    console.log('[createSession] Announcement created for new session');
  } catch (announcementError) {
    console.error('[createSession] Failed to create announcement:', announcementError);
    // Don't fail the session creation if announcement fails
  }

  // Send push notifications to community members
  try {
    const notificationResult = await notifyNewSession(
      newSession.id,
      sessionData.title,
      typeof newSession.datetime === 'string' ? newSession.datetime : newSession.datetime.toISOString(),
      sessionData.community_id,
      community.name
    );
    console.log(`[createSession] Notifications sent: ${notificationResult.sent} succeeded, ${notificationResult.failed} failed`);
  } catch (notificationError) {
    console.error('[createSession] Failed to send notifications:', notificationError);
    // Don't fail the session creation if notifications fail
  }

  return newSession;
};

export const getSessionById = async (sessionId: string): Promise<Session | null> => {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) {
    return null;
  }

  return data as Session;
};

export const getAvailableSessions = async (
  communityId?: string,
  limit: number = 50
): Promise<Session[]> => {
  let query = supabase
    .from('available_sessions')
    .select('*')
    .order('datetime', { ascending: true })
    .limit(limit);

  if (communityId) {
    query = query.eq('community_id', communityId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch sessions: ${error.message}`);
  }

  return data as Session[];
};

export const getSessionsByManager = async (
  managerId: string,
  status?: string
): Promise<Session[]> => {
  // Get communities managed by this user
  const { data: communities } = await supabase
    .from('communities')
    .select('id')
    .eq('manager_id', managerId);

  if (!communities || communities.length === 0) {
    return [];
  }

  const communityIds = communities.map((c) => c.id);

  let query = supabase
    .from('sessions')
    .select('*')
    .in('community_id', communityIds)
    .order('datetime', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch manager sessions: ${error.message}`);
  }

  return data as Session[];
};

export const updateSession = async (
  sessionId: string,
  updates: Partial<Session>,
  managerId: string
): Promise<Session> => {
  // Verify the manager owns this session's community
  const { data: session } = await supabase
    .from('sessions')
    .select('community_id')
    .eq('id', sessionId)
    .single();

  if (!session) {
    throw new Error('Session not found');
  }

  const { data: community } = await supabase
    .from('communities')
    .select('*')
    .eq('id', session.community_id)
    .eq('manager_id', managerId)
    .single();

  if (!community) {
    throw new Error('You do not have permission to update this session');
  }

  const { data, error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update session: ${error.message}`);
  }

  return data as Session;
};

export const cancelSession = async (
  sessionId: string,
  managerId: string
): Promise<void> => {
  await updateSession(sessionId, { status: 'cancelled' }, managerId);

  // TODO: Send notifications to all booked users
};

export const getSessionBookings = async (sessionId: string) => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      users:user_id (name, email, phone),
      payments (*)
    `)
    .eq('session_id', sessionId)
    .is('cancelled_at', null);

  if (error) {
    throw new Error(`Failed to fetch bookings: ${error.message}`);
  }

  return data;
};

export const getManagerStats = async (managerId: string) => {
  // Get communities managed by this user
  const { data: communities } = await supabase
    .from('communities')
    .select('id')
    .eq('manager_id', managerId);

  if (!communities || communities.length === 0) {
    return {
      upcomingSessions: 0,
      pastSessions: 0,
      totalBookings: 0,
      totalRevenue: 0,
      totalMembers: 0,
      pendingCancellations: 0,
    };
  }

  const communityIds = communities.map((c) => c.id);
  const now = new Date().toISOString();

  // Get upcoming sessions count (future sessions, not cancelled)
  const { count: upcomingSessions } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .in('community_id', communityIds)
    .neq('status', 'cancelled')
    .gte('datetime', now);

  // Get past sessions count (past sessions, not cancelled)
  const { count: pastSessions } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .in('community_id', communityIds)
    .neq('status', 'cancelled')
    .lt('datetime', now);

  // Get total bookings for manager's sessions
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id')
    .in('community_id', communityIds);

  const sessionIds = sessions?.map((s) => s.id) || [];

  let totalBookings = 0;
  let totalRevenue = 0;
  let pendingCancellations = 0;

  if (sessionIds.length > 0) {
    // Get bookings count
    const { count: bookingsCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('session_id', sessionIds)
      .is('cancelled_at', null);

    totalBookings = bookingsCount || 0;

    // Get booking IDs for revenue calculation
    const { data: bookingRecords } = await supabase
      .from('bookings')
      .select('id')
      .in('session_id', sessionIds);

    const bookingIds = bookingRecords?.map((b) => b.id) || [];

    // Get revenue from payments
    if (bookingIds.length > 0) {
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .in('booking_id', bookingIds)
        .eq('status', 'succeeded');

      totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    }

    // Get pending cancellation requests
    const { count: pendingCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('session_id', sessionIds)
      .eq('cancellation_status', 'pending')
      .is('cancelled_at', null);

    pendingCancellations = pendingCount || 0;
  }

  // Get unique members (users who have booked any session)
  const { data: uniqueUsers } = await supabase
    .from('bookings')
    .select('user_id')
    .in('session_id', sessionIds)
    .is('cancelled_at', null);

  const uniqueUserIds = new Set(uniqueUsers?.map((u) => u.user_id) || []);
  const totalMembers = uniqueUserIds.size;

  return {
    upcomingSessions: upcomingSessions || 0,
    pastSessions: pastSessions || 0,
    totalBookings,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalMembers,
    pendingCancellations,
  };
};

export const getCommunityMembers = async (managerId: string) => {
  console.log('[getCommunityMembers] Starting for manager:', managerId);

  // Get communities managed by this user
  const { data: communities, error: commError } = await supabase
    .from('communities')
    .select('id')
    .eq('manager_id', managerId);

  console.log('[getCommunityMembers] Communities:', communities?.length || 0, 'Error:', commError);

  if (!communities || communities.length === 0) {
    console.log('[getCommunityMembers] No communities found');
    return [];
  }

  const communityIds = communities.map((c) => c.id);
  console.log('[getCommunityMembers] Community IDs:', communityIds);

  // Get all community members with user information and community hierarchy
  const { data: membersRaw, error: membersError} = await supabase
    .from('community_members')
    .select(`
      user_id,
      community_id,
      joined_at,
      sub_community_id,
      users (
        id,
        name,
        email,
        phone,
        created_at
      ),
      communities (
        id,
        parent_community_id
      )
    `)
    .in('community_id', communityIds);

  console.log('[getCommunityMembers] Community members (raw):', membersRaw?.length || 0, 'Error:', membersError);

  if (!membersRaw || membersRaw.length === 0) {
    console.log('[getCommunityMembers] No members found');
    return [];
  }

  // Don't deduplicate - we want to keep all memberships including sub-communities
  // so the frontend can filter by sub-community
  const members = membersRaw;
  console.log('[getCommunityMembers] Total member records (including sub-communities):', members.length);

  // Get all sessions for these communities (for booking stats)
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id')
    .in('community_id', communityIds);

  const sessionIds = sessions?.map((s) => s.id) || [];

  // Get booking statistics for each member
  let bookingStats: any = {};
  if (sessionIds.length > 0) {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('user_id, created_at, cancelled_at')
      .in('session_id', sessionIds);

    bookings?.forEach((booking: any) => {
      if (!bookingStats[booking.user_id]) {
        bookingStats[booking.user_id] = {
          totalBookings: 0,
          activeBookings: 0,
          cancelledBookings: 0,
          lastBookingDate: null,
        };
      }

      const stats = bookingStats[booking.user_id];
      stats.totalBookings++;

      if (booking.cancelled_at) {
        stats.cancelledBookings++;
      } else {
        stats.activeBookings++;
      }

      if (!stats.lastBookingDate || new Date(booking.created_at) > new Date(stats.lastBookingDate)) {
        stats.lastBookingDate = booking.created_at;
      }
    });
  }

  // Combine member info with booking stats
  const result = members.map((member: any) => {
    const user = member.users;
    const stats = bookingStats[member.user_id] || {
      totalBookings: 0,
      activeBookings: 0,
      cancelledBookings: 0,
      lastBookingDate: null,
    };

    // If the community has a parent_community_id, it's a sub-community
    // In that case, set sub_community_id to the community_id
    const isSubCommunity = member.communities?.parent_community_id !== null;
    const subCommunityId = isSubCommunity ? member.community_id : null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      joinedAt: member.joined_at,
      status: 'active', // TODO: Add status column
      totalBookings: stats.totalBookings,
      activeBookings: stats.activeBookings,
      cancelledBookings: stats.cancelledBookings,
      lastBookingDate: stats.lastBookingDate,
      sub_community_id: subCommunityId,
    };
  });

  console.log('[getCommunityMembers] Returning members:', result.length);
  return result;
};

export const sendSessionNotification = async (
  sessionId: string,
  title: string,
  message: string,
  managerId: string
) => {
  console.log(`[sendSessionNotification] Sending notification for session ${sessionId}`);

  // Get session to verify manager has access
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*, communities!inner(id, name)')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    throw new Error('Session not found');
  }

  // Verify user can manage this community
  const { RoleService } = await import('./roleService');
  const canManage = await RoleService.canManageCommunity(managerId, session.community_id);

  if (!canManage) {
    throw new Error('You do not have permission to send notifications for this session');
  }

  // Get all confirmed bookings for this session
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select(`
      user_id,
      users!inner(id, name, push_token)
    `)
    .eq('session_id', sessionId)
    .eq('payment_status', 'completed');

  if (bookingsError) {
    console.error('[sendSessionNotification] Error fetching bookings:', bookingsError);
    throw new Error('Failed to fetch session attendees');
  }

  if (!bookings || bookings.length === 0) {
    console.log('[sendSessionNotification] No attendees found for this session');
    return {
      sent: 0,
      failed: 0,
      message: 'No attendees to notify',
    };
  }

  console.log(`[sendSessionNotification] Found ${bookings.length} attendees`);

  // Get unique user IDs
  const userIds = [...new Set(bookings.map(b => b.user_id))];

  console.log(`[sendSessionNotification] Sending to ${userIds.length} users`);

  // Send push notifications
  let sentCount = 0;
  let failedCount = 0;

  if (userIds.length > 0) {
    const { sendNotificationToMultipleUsers } = await import('./notificationService');
    const results = await sendNotificationToMultipleUsers(userIds, title, message, {
      type: 'session_notification',
      sessionId,
    });

    sentCount = results.sent;
    failedCount = results.failed;

    console.log(`[sendSessionNotification] Sent ${sentCount} notifications, ${failedCount} failed`);
  }

  return {
    sent: sentCount,
    failed: failedCount,
    totalAttendees: userIds.length,
  };
};
