import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ModelTrackingModel } from './repository/databaseRepo';
import modelTrackingRoutes from './routes/modelTracking.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logger
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    console.log(`[RES] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`);
  });
  next();
});

// Health check route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Model Tracking API',
    version: '1.0.0',
    status: 'running',
  });
});

// API routes
app.use('/api/model-tracking', modelTrackingRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: Function) => {
  console.error('[ERROR] Unhandled error middleware:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database table
    console.log('[BOOT] Initializing database tables...');
    await ModelTrackingModel.initializeTable();

    // Start server
    app.listen(PORT, () => {
      console.log(`[BOOT] Server is running on port ${PORT}`);
      console.log(`[BOOT] Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('[BOOT] Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app; 