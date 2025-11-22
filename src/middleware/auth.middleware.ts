/**
 * @file Authentication middleware
 * @module middleware/auth
 *
 * JWT validation and request context setup
 */

import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { supabaseAdmin } from '../config/database';
import { RequestContext, User, Company, License } from '../types';
import { licensingService } from '../services/licensing.service';
import { rbacService } from '../services/rbac.service';

/**
 * Extend Express Request to include our context
 */
declare global {
  namespace Express {
    interface Request {
      context?: RequestContext;
    }
  }
}

/**
 * Authentication middleware
 * Validates JWT and sets up request context
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.substring(7);

    // Verify JWT
    const payload = authService.verifyToken(token);
    if (!payload) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Get user from database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', payload.userId)
      .single();

    if (userError || !user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    // Get company
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('id', user.company_id)
      .single();

    if (companyError || !company) {
      res.status(403).json({ error: 'Company not found' });
      return;
    }

    // Validate license (skip for super users)
    let licenseValidation;
    if (!user.is_super_user) {
      licenseValidation = await licensingService.validateLicense(company.license_key);
      if (!licenseValidation.valid) {
        res.status(403).json({
          error: 'Invalid or expired license',
          reason: licenseValidation.reason,
        });
        return;
      }
    }

    // Get tenant if applicable
    let tenant;
    if (user.tenant_id) {
      const { data: tenantData } = await supabaseAdmin
        .from('tenants')
        .select('*')
        .eq('id', user.tenant_id)
        .single();
      tenant = tenantData;
    }

    // Get user permissions
    const { permissions } = await rbacService.getUserRolesAndPermissions(user.id);
    const permissionSet = new Set(permissions.map((p) => p.name));

    // Set request context
    req.context = {
      user: user as User,
      company: company as Company,
      tenant,
      license: licenseValidation?.license || null,
      permissions: permissionSet,
    };

    next();
  } catch (error) {
    res.status(500).json({
      error: 'Authentication error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Permission check middleware factory
 * Creates middleware that checks for specific permissions
 *
 * @param requiredPermission - Permission name required
 */
export function requirePermission(requiredPermission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.context) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Super user bypasses permission checks
    if (req.context.user.is_super_user) {
      next();
      return;
    }

    // Check if user has required permission
    if (!req.context.permissions.has(requiredPermission)) {
      res.status(403).json({
        error: 'Insufficient permissions',
        required: requiredPermission,
      });
      return;
    }

    next();
  };
}

/**
 * Organization admin check middleware
 */
export function requireOrgAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.context) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (!req.context.user.is_org_admin && !req.context.user.is_super_user) {
    res.status(403).json({ error: 'Organization admin access required' });
    return;
  }

  next();
}

/**
 * Super user check middleware
 */
export function requireSuperUser(req: Request, res: Response, next: NextFunction): void {
  if (!req.context) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (!req.context.user.is_super_user) {
    res.status(403).json({ error: 'Super user access required' });
    return;
  }

  next();
}
