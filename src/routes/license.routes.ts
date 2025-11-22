/**
 * @file License management routes
 * @module routes/license
 */

import { Router, Request, Response } from 'express';
import { licensingService } from '../services/licensing.service';
import { authenticate, requirePermission, requireSuperUser } from '../middleware/auth.middleware';
import { createAuditLogEntry } from '../middleware/audit.middleware';
import { supabaseAdmin } from '../config/database';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/licenses
 * Get all licenses (super user only)
 */
router.get('/', requireSuperUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: licenses, error } = await supabaseAdmin
      .from('licenses')
      .select(`
        *,
        companies (
          id,
          name,
          domain
        )
      `)
      .order('issued_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json(licenses || []);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch licenses',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/licenses/:id
 * Get specific license details
 */
router.get('/:id', requireSuperUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: license, error } = await supabaseAdmin
      .from('licenses')
      .select(`
        *,
        companies (
          id,
          name,
          domain
        )
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !license) {
      res.status(404).json({ error: 'License not found' });
      return;
    }

    res.json(license);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch license',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/licenses
 * Generate new license
 */
router.post('/', requireSuperUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId, companyName, features, expiresInDays } = req.body;

    if (!companyId || !companyName || !features) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const licenseKey = await licensingService.generateLicense(
      companyId,
      companyName,
      features,
      expiresInDays
    );

    // Audit log
    await createAuditLogEntry(
      req.context!.user.id,
      req.context!.company.id,
      'license.create',
      'license',
      null,
      { companyId, companyName, features },
      req
    );

    res.status(201).json({
      message: 'License generated successfully',
      licenseKey,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate license',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/licenses/:id/revoke
 * Revoke a license
 */
router.post('/:id/revoke', requireSuperUser, async (req: Request, res: Response): Promise<void> => {
  try {
    await licensingService.revokeLicense(req.params.id);

    // Audit log
    await createAuditLogEntry(
      req.context!.user.id,
      req.context!.company.id,
      'license.revoke',
      'license',
      req.params.id,
      {},
      req
    );

    res.json({ message: 'License revoked successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to revoke license',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/licenses/:id/suspend
 * Suspend a license
 */
router.post('/:id/suspend', requireSuperUser, async (req: Request, res: Response): Promise<void> => {
  try {
    await licensingService.suspendLicense(req.params.id);

    // Audit log
    await createAuditLogEntry(
      req.context!.user.id,
      req.context!.company.id,
      'license.suspend',
      'license',
      req.params.id,
      {},
      req
    );

    res.json({ message: 'License suspended successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to suspend license',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/licenses/:id/reactivate
 * Reactivate a suspended license
 */
router.post('/:id/reactivate', requireSuperUser, async (req: Request, res: Response): Promise<void> => {
  try {
    await licensingService.reactivateLicense(req.params.id);

    // Audit log
    await createAuditLogEntry(
      req.context!.user.id,
      req.context!.company.id,
      'license.reactivate',
      'license',
      req.params.id,
      {},
      req
    );

    res.json({ message: 'License reactivated successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to reactivate license',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/licenses/:id/validate
 * Validate a license
 */
router.post('/:id/validate', requireSuperUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: license, error } = await supabaseAdmin
      .from('licenses')
      .select('license_key')
      .eq('id', req.params.id)
      .single();

    if (error || !license) {
      res.status(404).json({ error: 'License not found' });
      return;
    }

    const validation = await licensingService.validateLicense(license.license_key);

    res.json(validation);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to validate license',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
