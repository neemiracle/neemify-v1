/**
 * @file Main routes index
 * @module routes
 */

import { Router } from 'express';
import authRoutes from './auth.routes';
import tenantRoutes from './tenant.routes';

const router = Router();

// Health check endpoint (no auth required)
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'NEEMIFY Medical OS API',
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/tenants', tenantRoutes);

export default router;
