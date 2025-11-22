/**
 * @file Tenant management routes
 * @module routes/tenant
 */

import { Router, Request, Response } from 'express';
import { tenantService } from '../services/tenant.service';
import { authenticate, requirePermission, requireOrgAdmin } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/tenants
 * Create a new child tenant
 */
router.post('/', requireOrgAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, subdomain, settings } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Tenant name is required' });
      return;
    }

    const result = await tenantService.createChildTenant(
      req.context!.company.id,
      name,
      subdomain,
      settings
    );

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(201).json(result.tenant);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create tenant',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/tenants
 * Get all child tenants for the company
 */
router.get('/', requirePermission('tenant.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenants = await tenantService.getChildTenants(req.context!.company.id);
    res.json(tenants);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch tenants',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/tenants/:id
 * Get specific tenant details
 */
router.get('/:id', requirePermission('tenant.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenant = await tenantService.getTenantById(req.params.id);

    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    // Verify access
    const hasAccess = await tenantService.userHasAccessToTenant(
      req.context!.user.id,
      req.params.id
    );

    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied to this tenant' });
      return;
    }

    res.json(tenant);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch tenant',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PATCH /api/tenants/:id
 * Update tenant
 */
router.patch('/:id', requireOrgAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await tenantService.updateTenant(req.params.id, req.body);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ message: 'Tenant updated successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update tenant',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/tenants/:id
 * Delete tenant
 */
router.delete('/:id', requireOrgAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await tenantService.deleteTenant(req.params.id);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete tenant',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/tenants/:id/stats
 * Get tenant usage statistics
 */
router.get('/:id/stats', requirePermission('tenant.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await tenantService.getTenantUsageStats(req.params.id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch tenant stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
