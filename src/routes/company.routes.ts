/**
 * @file Company management routes
 * @module routes/company
 */

import { Router, Request, Response } from 'express';
import { companyService } from '../services/company.service';
import { authenticate, requirePermission, requireSuperUser } from '../middleware/auth.middleware';
import { createAuditLogEntry } from '../middleware/audit.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/companies
 * Get all companies (super user only)
 */
router.get('/', requireSuperUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: companies, error } = await (await import('../config/database')).supabaseAdmin
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json(companies || []);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch companies',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/companies/:id
 * Get specific company details
 */
router.get('/:id', requireSuperUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const company = await companyService.getCompanyById(req.params.id);

    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }

    res.json(company);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch company',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/companies/:id/stats
 * Get company statistics
 */
router.get('/:id/stats', requireSuperUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await companyService.getCompanyUsageStats(req.params.id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch company stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/companies/:id/users
 * Get all users in a company
 */
router.get('/:id/users', requireSuperUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await companyService.getCompanyUsers(req.params.id);
    res.json(users);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch company users',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/companies
 * Create new company
 */
router.post('/', requireSuperUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, domain, features, expiresInDays } = req.body;

    if (!name || !domain) {
      res.status(400).json({ error: 'Missing required fields: name and domain' });
      return;
    }

    // Default license features if not provided
    const defaultFeatures = {
      max_users: 50,
      max_tenants: 10,
      max_api_calls_per_day: 10000,
      features: ['basic', 'multi_tenant', 'rbac'],
    };

    const result = await companyService.createCompany(
      name,
      domain,
      features || defaultFeatures,
      expiresInDays
    );

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    // Audit log
    await createAuditLogEntry(
      req.context!.user.id,
      req.context!.company.id,
      'company.create',
      'company',
      result.company!.id,
      req.body,
      req
    );

    res.status(201).json({
      message: 'Company created successfully',
      company: result.company,
      licenseKey: result.licenseKey,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create company',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PATCH /api/companies/:id
 * Update company details
 */
router.patch('/:id', requireSuperUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await companyService.updateCompany(req.params.id, req.body);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    // Audit log
    await createAuditLogEntry(
      req.context!.user.id,
      req.context!.company.id,
      'company.update',
      'company',
      req.params.id,
      req.body,
      req
    );

    res.json({ message: 'Company updated successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update company',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/companies/:id/verification-info
 * Get DNS verification information for a company
 */
router.get('/:id/verification-info', requireSuperUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const company = await companyService.getCompanyById(req.params.id);

    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }

    res.json({
      domain: company.domain,
      verificationToken: company.domain_verification_token,
      verified: company.domain_verified || false,
      verifiedAt: company.verified_at,
      txtRecordName: `_neemify-verification.${company.domain}`,
      txtRecordValue: `neemify-verification=${company.domain_verification_token}`,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get verification info',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/companies/:id/verify-domain
 * Verify company domain via DNS TXT record
 */
router.post('/:id/verify-domain', requireSuperUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await companyService.verifyDomainViaDNS(req.params.id);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    if (result.verified) {
      // Audit log
      await createAuditLogEntry(
        req.context!.user.id,
        req.context!.company.id,
        'company.verify_domain',
        'company',
        req.params.id,
        {},
        req
      );
    }

    res.json({
      verified: result.verified,
      message: result.message,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to verify domain',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/companies/:id/block
 * Block a company
 */
router.post('/:id/block', requireSuperUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const { reason } = req.body;

    const { data, error } = await (await import('../config/database')).supabaseAdmin
      .from('companies')
      .update({
        is_blocked: true,
        blocked_at: new Date().toISOString(),
        blocked_reason: reason || 'No reason provided',
        blocked_by_user_id: req.context!.user.id,
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // Audit log
    await createAuditLogEntry(
      req.context!.user.id,
      req.context!.company.id,
      'company.block',
      'company',
      req.params.id,
      { reason },
      req
    );

    res.json({ message: 'Company blocked successfully', company: data });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to block company',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/companies/:id/unblock
 * Unblock a company
 */
router.post('/:id/unblock', requireSuperUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await (await import('../config/database')).supabaseAdmin
      .from('companies')
      .update({
        is_blocked: false,
        blocked_at: null,
        blocked_reason: null,
        blocked_by_user_id: null,
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // Audit log
    await createAuditLogEntry(
      req.context!.user.id,
      req.context!.company.id,
      'company.unblock',
      'company',
      req.params.id,
      {},
      req
    );

    res.json({ message: 'Company unblocked successfully', company: data });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to unblock company',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/companies/:id
 * Delete a company (with safety checks)
 */
router.delete('/:id', requireSuperUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const { supabaseAdmin } = await import('../config/database');

    // Check if this is the system company
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('domain')
      .eq('id', req.params.id)
      .single();

    if (company?.domain === 'neemify.system') {
      res.status(403).json({ error: 'Cannot delete system company' });
      return;
    }

    // Check if company has users
    const { count: userCount } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', req.params.id);

    if (userCount && userCount > 0) {
      res.status(400).json({
        error: 'Cannot delete company with existing users',
        userCount,
        message: 'Please delete or reassign all users first',
      });
      return;
    }

    // Check if company has tenants
    const { count: tenantCount } = await supabaseAdmin
      .from('tenants')
      .select('id', { count: 'exact', head: true })
      .eq('parent_company_id', req.params.id);

    if (tenantCount && tenantCount > 0) {
      res.status(400).json({
        error: 'Cannot delete company with existing tenants',
        tenantCount,
        message: 'Please delete all tenants first',
      });
      return;
    }

    // Delete the company
    const { error } = await supabaseAdmin
      .from('companies')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // Audit log
    await createAuditLogEntry(
      req.context!.user.id,
      req.context!.company.id,
      'company.delete',
      'company',
      req.params.id,
      {},
      req
    );

    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete company',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
