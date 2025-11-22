/**
 * @file Audit log routes
 * @module routes/audit-log
 */

import { Router, Request, Response } from 'express';
import { authenticate, requirePermission, requireSuperUser } from '../middleware/auth.middleware';
import { supabaseAdmin } from '../config/database';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/audit-logs
 * Get audit logs
 */
router.get('/', requirePermission('audit.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, companyId, tenantId, userId, action, limit = '100' } = req.query;

    let query = supabaseAdmin
      .from('audit_logs')
      .select(`
        *,
        users (
          id,
          email,
          full_name
        )
      `)
      .order('timestamp', { ascending: false })
      .limit(parseInt(limit as string));

    // Filter by company (unless super user)
    if (!req.context!.user.is_super_user) {
      query = query.eq('company_id', req.context!.company.id);
    } else if (companyId) {
      query = query.eq('company_id', companyId);
    }

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (action) {
      query = query.eq('action', action);
    }

    if (startDate) {
      query = query.gte('timestamp', startDate);
    }

    if (endDate) {
      query = query.lte('timestamp', endDate);
    }

    const { data, error } = await query;

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json(data || []);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch audit logs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/audit-logs/:id
 * Get specific audit log entry
 */
router.get('/:id', requirePermission('audit.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select(`
        *,
        users (
          id,
          email,
          full_name
        )
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Audit log not found' });
      return;
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch audit log',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/audit-logs/by-user/:userId
 * Get audit logs for specific user
 */
router.get('/by-user/:userId', requirePermission('audit.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = '100' } = req.query;

    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('user_id', req.params.userId)
      .order('timestamp', { ascending: false })
      .limit(parseInt(limit as string));

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json(data || []);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch user audit logs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/audit-logs/by-company/:companyId
 * Get audit logs for specific company
 */
router.get('/by-company/:companyId', requireSuperUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = '100' } = req.query;

    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select(`
        *,
        users (
          id,
          email,
          full_name
        )
      `)
      .eq('company_id', req.params.companyId)
      .order('timestamp', { ascending: false })
      .limit(parseInt(limit as string));

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json(data || []);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch company audit logs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/audit-logs/by-action/:action
 * Get audit logs for specific action
 */
router.get('/by-action/:action', requirePermission('audit.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = '100' } = req.query;

    let query = supabaseAdmin
      .from('audit_logs')
      .select(`
        *,
        users (
          id,
          email,
          full_name
        )
      `)
      .eq('action', req.params.action)
      .order('timestamp', { ascending: false })
      .limit(parseInt(limit as string));

    // Filter by company unless super user
    if (!req.context!.user.is_super_user) {
      query = query.eq('company_id', req.context!.company.id);
    }

    const { data, error } = await query;

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json(data || []);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch action audit logs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
