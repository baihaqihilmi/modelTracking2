import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ModelTrackingModel } from './models/modelTracking.model';
import modelTrackingRoutes from './routes/modelTracking.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
  console.error('Error:', err);
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
    await ModelTrackingModel.initializeTable();

    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app; 