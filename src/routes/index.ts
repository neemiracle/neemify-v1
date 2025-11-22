/**
 * @file Main routes index
 * @module routes
 */

import { Router } from 'express';
import authRoutes from './auth.routes';
import tenantRoutes from './tenant.routes';
import companyRoutes from './company.routes';
import userRoutes from './user.routes';
import licenseRoutes from './license.routes';
import apiUsageRoutes from './api-usage.routes';
import auditLogRoutes from './audit-log.routes';
import dashboardRoutes from './dashboard.routes';

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
router.use('/companies', companyRoutes);
router.use('/users', userRoutes);
router.use('/licenses', licenseRoutes);
router.use('/api-usage', apiUsageRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
