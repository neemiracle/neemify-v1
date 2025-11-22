/**
 * @file Authentication routes
 * @module routes/auth
 */

import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { companyService } from '../services/company.service';
import { rbacService } from '../services/rbac.service';
import { authRateLimiter } from '../middleware/rate-limit.middleware';
import { LicenseFeatures } from '../types';

const router = Router();

/**
 * POST /api/auth/signup
 * User signup with domain validation
 */
router.post('/signup', authRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName, createNewCompany } = req.body;

    if (!email || !password || !fullName) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Validate domain
    const domainValidation = await companyService.validateDomain(email);

    if (domainValidation.exists && !createNewCompany) {
      // Domain exists, user needs to request access
      const admin = await companyService.getOrgAdmin(domainValidation.company!.id);
      res.status(200).json({
        domainExists: true,
        companyName: domainValidation.company!.name,
        message: 'Company already exists. Request access from your admin or create a new company.',
        adminEmail: admin?.email,
      });
      return;
    }

    // Create new company
    const domain = email.split('@')[1];
    const companyName = req.body.companyName || domain;

    // Default license features
    const defaultFeatures: LicenseFeatures = {
      max_users: 50,
      max_tenants: 10,
      api_rate_limit: 1000,
      enabled_modules: ['core', 'users', 'tenants'],
      custom_features: {},
    };

    const companyResult = await companyService.createCompany(
      companyName,
      domain,
      defaultFeatures,
      365 // 1 year license
    );

    if (!companyResult.success) {
      res.status(400).json({ error: companyResult.error });
      return;
    }

    // Register user as organization admin
    const userResult = await authService.register(
      email,
      password,
      fullName,
      companyResult.company!.id,
      true // isOrgAdmin
    );

    if (!userResult.success) {
      res.status(400).json({ error: userResult.error });
      return;
    }

    // Create default roles for the company
    await rbacService.createDefaultRoles(companyResult.company!.id);

    res.status(201).json({
      message: 'Company and user created successfully',
      userId: userResult.userId,
      companyId: companyResult.company!.id,
      licenseKey: companyResult.licenseKey,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Signup failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', authRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Missing email or password' });
      return;
    }

    const result = await authService.login(email, password);

    if (!result.success) {
      res.status(401).json({ error: result.error });
      return;
    }

    res.json({
      token: result.token,
      user: {
        id: result.user!.id,
        email: result.user!.email,
        fullName: result.user!.full_name,
        companyId: result.user!.company_id,
        isOrgAdmin: result.user!.is_org_admin,
        isSuperUser: result.user!.is_super_user,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Login failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/auth/request-access
 * Request access to existing company
 */
router.post('/request-access', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, companyId } = req.body;

    if (!email || !companyId) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const result = await companyService.requestCompanyAccess(companyId, email);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Request failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
