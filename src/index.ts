/**
 * @file Main application entry point
 * @module index
 *
 * NEEMIFY Medical OS API Infrastructure
 * High-performance, secure, multi-tenant API gateway
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config';
import routes from './routes';
import { auditLog } from './middleware/audit.middleware';
import { apiRateLimiter } from './middleware/rate-limit.middleware';
import { authService } from './services/auth.service';

/**
 * NEEMIFY Application Server
 */
class NEEMIFYServer {
  private app: Application;

  constructor() {
    this.app = express();
    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  /**
   * Configure Express middleware
   * Banking-grade security and performance optimizations
   */
  private configureMiddleware(): void {
    // Security headers
    this.app.use(helmet());

    // CORS configuration
    this.app.use(
      cors({
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        credentials: true,
      })
    );

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    this.app.use('/api', apiRateLimiter);

    // Audit logging
    this.app.use('/api', auditLog);

    // Request logging in development
    if (config.server.env === 'development') {
      this.app.use((req: Request, res: Response, next: NextFunction) => {
        console.log(`${req.method} ${req.path}`);
        next();
      });
    }
  }

  /**
   * Configure API routes
   */
  private configureRoutes(): void {
    // Mount API routes
    this.app.use('/api', routes);

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        service: 'NEEMIFY Medical OS API',
        version: '1.0.0',
        status: 'operational',
        documentation: '/api/docs',
      });
    });

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not found',
        path: req.path,
      });
    });
  }

  /**
   * Configure error handling
   */
  private configureErrorHandling(): void {
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Unhandled error:', err);

      res.status(500).json({
        error: 'Internal server error',
        message: config.server.env === 'development' ? err.message : 'An error occurred',
      });
    });
  }

  /**
   * Initialize super user (one-time setup)
   */
  async initializeSuperUser(): Promise<void> {
    console.log('Checking super user setup...');
    const result = await authService.initializeSuperUser();
    console.log(result.message);
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    try {
      // Initialize super user if needed
      await this.initializeSuperUser();

      // Start listening
      this.app.listen(config.server.port, () => {
        console.log('='.repeat(60));
        console.log('NEEMIFY Medical OS API Infrastructure');
        console.log('='.repeat(60));
        console.log(`Environment: ${config.server.env}`);
        console.log(`Server running on port: ${config.server.port}`);
        console.log(`API endpoint: http://localhost:${config.server.port}/api`);
        console.log('='.repeat(60));
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Start the server
const server = new NEEMIFYServer();
server.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
