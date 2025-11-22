/**
 * @file Dashboard statistics routes
 * @module routes/dashboard
 */

import { Router, Request, Response } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { supabaseAdmin } from '../config/database';
import { userService } from '../services/user.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/dashboard/stats
 * Get aggregated dashboard statistics
 */
router.get('/stats', requirePermission('api.use'), async (req: Request, res: Response): Promise<void> => {
  try {
    // Get companies count
    const { count: totalCompanies } = await supabaseAdmin
      .from('companies')
      .select('id', { count: 'exact', head: true });

    // Get tenants count
    const { count: totalTenants } = await supabaseAdmin
      .from('tenants')
      .select('id', { count: 'exact', head: true });

    // Get active tenants count
    const { count: activeTenants } = await supabaseAdmin
      .from('tenants')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get total users
    const totalUsers = await userService.getTotalUserCount();

    // Get active licenses
    const { count: activeLicenses } = await supabaseAdmin
      .from('licenses')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');

    // Get expired licenses
    const { count: expiredLicenses } = await supabaseAdmin
      .from('licenses')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'expired');

    // Get suspended licenses
    const { count: suspendedLicenses } = await supabaseAdmin
      .from('licenses')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'suspended');

    // Get API calls today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count: apiCallsToday } = await supabaseAdmin
      .from('api_usage')
      .select('id', { count: 'exact', head: true })
      .gte('timestamp', todayStart.toISOString());

    // Get API calls this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { count: apiCallsThisMonth } = await supabaseAdmin
      .from('api_usage')
      .select('id', { count: 'exact', head: true })
      .gte('timestamp', monthStart.toISOString());

    res.json({
      totalCompanies: totalCompanies || 0,
      totalTenants: totalTenants || 0,
      activeTenants: activeTenants || 0,
      totalUsers: totalUsers || 0,
      activeLicenses: activeLicenses || 0,
      expiredLicenses: expiredLicenses || 0,
      suspendedLicenses: suspendedLicenses || 0,
      apiCallsToday: apiCallsToday || 0,
      apiCallsThisMonth: apiCallsThisMonth || 0,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch dashboard stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/dashboard/recent-activity
 * Get recent system activity
 */
router.get('/recent-activity', requirePermission('audit.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = '10' } = req.query;

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
      error: 'Failed to fetch recent activity',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
