import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AuthRequest, UserRole } from '../types';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      phone: decoded.phone,
      role: decoded.role,
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    console.log('[requireRole] User role:', req.user.role, 'Required roles:', roles);

    if (!roles.includes(req.user.role)) {
      console.log('[requireRole] Permission denied - user role not in required roles');
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    console.log('[requireRole] Permission granted');
    next();
  };
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      req.user = {
        id: decoded.userId,
        email: decoded.email,
        phone: decoded.phone,
        role: decoded.role,
      };
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
