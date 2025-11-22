/**
 * @file Audit logging middleware
 * @module middleware/audit
 *
 * Logs all API requests for compliance and security
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/database';

/**
 * Audit logging middleware
 * Records all API calls with user, company, and tenant context
 */
export async function auditLog(req: Request, res: Response, next: NextFunction): Promise<void> {
  const startTime = Date.now();

  // Capture the original res.json to intercept the response
  const originalJson = res.json.bind(res);

  res.json = function (body: any): Response {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Log to database asynchronously (don't block response)
    if (req.context) {
      supabaseAdmin
        .from('api_usage')
        .insert({
          id: uuidv4(),
          company_id: req.context.company.id,
          tenant_id: req.context.tenant?.id || null,
          user_id: req.context.user.id,
          endpoint: req.path,
          method: req.method,
          response_status: res.statusCode,
          response_time_ms: responseTime,
          timestamp: new Date().toISOString(),
        })
        .then(() => {
          // Success - no action needed
        })
        .catch((error) => {
          console.error('Failed to log API usage:', error);
        });
    }

    return originalJson(body);
  };

  next();
}

/**
 * Create audit log entry for sensitive actions
 *
 * @param userId - User performing action
 * @param companyId - Company ID
 * @param action - Action performed
 * @param resource - Resource type
 * @param resourceId - Resource ID
 * @param changes - Changes made
 * @param req - Express request object
 */
export async function createAuditLogEntry(
  userId: string,
  companyId: string,
  action: string,
  resource: string,
  resourceId: string | null,
  changes: Record<string, unknown>,
  req: Request
): Promise<void> {
  try {
    await supabaseAdmin.from('audit_logs').insert({
      id: uuidv4(),
      user_id: userId,
      company_id: companyId,
      tenant_id: req.context?.tenant?.id || null,
      action,
      resource,
      resource_id: resourceId,
      changes,
      ip_address: req.ip || req.socket.remoteAddress || null,
      user_agent: req.headers['user-agent'] || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to create audit log entry:', error);
  }
}
