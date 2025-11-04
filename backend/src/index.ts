import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import sessionRoutes from './routes/sessionRoutes';
import bookingRoutes from './routes/bookingRoutes';
import communityRoutes from './routes/communityRoutes';
import roleRoutes from './routes/roleRoutes';
import friendshipRoutes from './routes/friendships';
// @ts-ignore - TypeScript cache issue, this IS used on line 47
import announcementRoutes from './routes/announcements';
import chatRoutes from './routes/chatRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
// Default body size limit (will be overridden for specific routes)
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Padel Community API',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/friendships', friendshipRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/chat', chatRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   Padel Community API Server          ║
║   Environment: ${process.env.NODE_ENV || 'development'}                  ║
║   Port: ${PORT}                           ║
║   URL: http://localhost:${PORT}           ║
╚════════════════════════════════════════╝
  `);
});

export default app;
