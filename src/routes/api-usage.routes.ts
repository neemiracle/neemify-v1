/**
 * @file API usage tracking routes
 * @module routes/api-usage
 */

import { Router, Request, Response } from 'express';
import { authenticate, requirePermission, requireSuperUser } from '../middleware/auth.middleware';
import { supabaseAdmin } from '../config/database';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/api-usage
 * Get API usage logs
 */
router.get('/', requirePermission('audit.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, companyId, tenantId, limit = '100' } = req.query;

    let query = supabaseAdmin
      .from('api_usage')
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
      error: 'Failed to fetch API usage',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/api-usage/stats
 * Get API usage statistics
 */
router.get('/stats', requirePermission('audit.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId, tenantId } = req.query;

    // Get total count
    let countQuery = supabaseAdmin
      .from('api_usage')
      .select('id', { count: 'exact', head: true });

    if (companyId) {
      countQuery = countQuery.eq('company_id', companyId);
    }

    if (tenantId) {
      countQuery = countQuery.eq('tenant_id', tenantId);
    }

    const { count: totalCalls } = await countQuery;

    // Get calls today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let todayQuery = supabaseAdmin
      .from('api_usage')
      .select('id', { count: 'exact', head: true })
      .gte('timestamp', todayStart.toISOString());

    if (companyId) {
      todayQuery = todayQuery.eq('company_id', companyId);
    }

    const { count: callsToday } = await todayQuery;

    // Get calls this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    let monthQuery = supabaseAdmin
      .from('api_usage')
      .select('id', { count: 'exact', head: true })
      .gte('timestamp', monthStart.toISOString());

    if (companyId) {
      monthQuery = monthQuery.eq('company_id', companyId);
    }

    const { count: callsThisMonth } = await monthQuery;

    // Get average response time
    let avgQuery = supabaseAdmin
      .from('api_usage')
      .select('response_time_ms');

    if (companyId) {
      avgQuery = avgQuery.eq('company_id', companyId);
    }

    const { data: responses } = await avgQuery;

    const avgResponseTime = responses && responses.length > 0
      ? responses.reduce((sum: number, r: any) => sum + r.response_time_ms, 0) / responses.length
      : 0;

    res.json({
      totalCalls: totalCalls || 0,
      callsToday: callsToday || 0,
      callsThisMonth: callsThisMonth || 0,
      avgResponseTime: Math.round(avgResponseTime),
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch usage stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/api-usage/by-endpoint
 * Get usage grouped by endpoint
 */
router.get('/by-endpoint', requireSuperUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('api_usage')
      .select('endpoint, method')
      .order('timestamp', { ascending: false })
      .limit(1000);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // Group by endpoint
    const grouped = (data || []).reduce((acc: any, item: any) => {
      const key = `${item.method} ${item.endpoint}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const result = Object.entries(grouped).map(([endpoint, count]) => ({
      endpoint,
      count,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch endpoint usage',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
