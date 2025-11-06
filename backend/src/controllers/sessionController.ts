import { Response } from 'express';
import {
  createSession,
  getSessionById,
  getAvailableSessions,
  getSessionsByManager,
  updateSession,
  cancelSession,
  getSessionBookings,
  getManagerStats,
  getCommunityMembers,
} from '../services/sessionService';
import { AuthRequest } from '../types';

export const createSessionHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const session = await createSession(req.body, req.user.id);

    res.status(201).json({
      message: 'Session created successfully',
      session,
    });
  } catch (error: any) {
    console.error('Create session error:', error);
    res.status(400).json({ error: error.message || 'Failed to create session' });
  }
};

export const getSessionHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const session = await getSessionById(id);

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.status(200).json({ session });
  } catch (error: any) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
};

export const getAvailableSessionsHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { community_id, limit } = req.query;

    const sessions = await getAvailableSessions(
      community_id as string | undefined,
      limit ? parseInt(limit as string) : 50
    );

    res.status(200).json({ sessions });
  } catch (error: any) {
    console.error('Get available sessions error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch sessions' });
  }
};

export const getManagerSessionsHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { status } = req.query;

    const sessions = await getSessionsByManager(
      req.user.id,
      status as string | undefined
    );

    res.status(200).json({ sessions });
  } catch (error: any) {
    console.error('Get manager sessions error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch sessions' });
  }
};

export const updateSessionHandler = async (
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
    delete updates.booked_count;
    delete updates.created_at;
    delete updates.updated_at;

    const session = await updateSession(id, updates, req.user.id);

    res.status(200).json({
      message: 'Session updated successfully',
      session,
    });
  } catch (error: any) {
    console.error('Update session error:', error);
    res.status(400).json({ error: error.message || 'Failed to update session' });
  }
};

export const cancelSessionHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;

    await cancelSession(id, req.user.id);

    res.status(200).json({
      message: 'Session cancelled successfully',
    });
  } catch (error: any) {
    console.error('Cancel session error:', error);
    res.status(400).json({ error: error.message || 'Failed to cancel session' });
  }
};

export const getSessionBookingsHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const bookings = await getSessionBookings(id);

    res.status(200).json({ bookings });
  } catch (error: any) {
    console.error('Get session bookings error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch bookings' });
  }
};

export const getManagerStatsHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const stats = await getManagerStats(req.user.id);

    res.status(200).json({ stats });
  } catch (error: any) {
    console.error('Get manager stats error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch stats' });
  }
};

export const getCommunityMembersHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const members = await getCommunityMembers(req.user.id);

    res.status(200).json({ members });
  } catch (error: any) {
    console.error('Get community members error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch members' });
  }
};

export const sendSessionNotificationHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id: sessionId } = req.params;
    const { title, message } = req.body;

    // Import here to avoid circular dependency
    const { sendSessionNotification } = await import('../services/sessionService');

    const result = await sendSessionNotification(sessionId, title, message, req.user.id);

    res.status(200).json({
      message: 'Notification sent successfully',
      ...result,
    });
  } catch (error: any) {
    console.error('Send session notification error:', error);
    res.status(400).json({ error: error.message || 'Failed to send notification' });
  }
};
