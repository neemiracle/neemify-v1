/**
 * @file Multi-tenant management service
 * @module services/tenant
 *
 * Handles hierarchical multi-tenancy with parent companies and child tenants
 */

import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/database';
import { Tenant, Company } from '../types';

/**
 * Tenant Service
 * Manages hierarchical multi-tenant architecture
 */
export class TenantService {
  /**
   * Create a new child tenant for a parent company
   *
   * @param parentCompanyId - Parent company ID
   * @param name - Tenant name
   * @param subdomain - Optional subdomain
   * @param settings - Tenant-specific settings
   */
  async createChildTenant(
    parentCompanyId: string,
    name: string,
    subdomain?: string,
    settings: Record<string, unknown> = {}
  ): Promise<{ success: boolean; tenant?: Tenant; error?: string }> {
    try {
      // Verify parent company exists and has valid license
      const { data: company, error: companyError } = await supabaseAdmin
        .from('companies')
        .select('*')
        .eq('id', parentCompanyId)
        .single();

      if (companyError || !company) {
        return { success: false, error: 'Parent company not found' };
      }

      if (company.license_status !== 'active') {
        return { success: false, error: 'Parent company license is not active' };
      }

      // Check if subdomain is already taken
      if (subdomain) {
        const { data: existingTenant } = await supabaseAdmin
          .from('tenants')
          .select('id')
          .eq('subdomain', subdomain)
          .single();

        if (existingTenant) {
          return { success: false, error: 'Subdomain already exists' };
        }
      }

      // Create tenant
      const tenantId = uuidv4();
      const { data: tenant, error } = await supabaseAdmin
        .from('tenants')
        .insert({
          id: tenantId,
          parent_company_id: parentCompanyId,
          name,
          subdomain,
          settings,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, tenant: tenant as Tenant };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create tenant',
      };
    }
  }

  /**
   * Get all child tenants for a company
   *
   * @param parentCompanyId - Parent company ID
   */
  async getChildTenants(parentCompanyId: string): Promise<Tenant[]> {
    const { data: tenants, error } = await supabaseAdmin
      .from('tenants')
      .select('*')
      .eq('parent_company_id', parentCompanyId)
      .order('created_at', { ascending: false });

    if (error || !tenants) {
      return [];
    }

    return tenants as Tenant[];
  }

  /**
   * Get a specific tenant by ID
   *
   * @param tenantId - Tenant ID
   */
  async getTenantById(tenantId: string): Promise<Tenant | null> {
    const { data: tenant, error } = await supabaseAdmin
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (error || !tenant) {
      return null;
    }

    return tenant as Tenant;
  }

  /**
   * Update tenant settings
   *
   * @param tenantId - Tenant ID
   * @param updates - Fields to update
   */
  async updateTenant(
    tenantId: string,
    updates: Partial<Omit<Tenant, 'id' | 'parent_company_id' | 'created_at'>>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseAdmin
        .from('tenants')
        .update(updates)
        .eq('id', tenantId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update tenant',
      };
    }
  }

  /**
   * Deactivate a tenant
   *
   * @param tenantId - Tenant ID
   */
  async deactivateTenant(tenantId: string): Promise<{ success: boolean; error?: string }> {
    return this.updateTenant(tenantId, { is_active: false });
  }

  /**
   * Activate a tenant
   *
   * @param tenantId - Tenant ID
   */
  async activateTenant(tenantId: string): Promise<{ success: boolean; error?: string }> {
    return this.updateTenant(tenantId, { is_active: true });
  }

  /**
   * Delete a tenant and all associated data
   *
   * @param tenantId - Tenant ID
   */
  async deleteTenant(tenantId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Note: Cascade delete will handle related records
      const { error } = await supabaseAdmin.from('tenants').delete().eq('id', tenantId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete tenant',
      };
    }
  }

  /**
   * Check if a user has access to a specific tenant
   *
   * @param userId - User ID
   * @param tenantId - Tenant ID
   */
  async userHasAccessToTenant(userId: string, tenantId: string): Promise<boolean> {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('company_id, tenant_id, is_org_admin')
      .eq('id', userId)
      .single();

    if (!user) {
      return false;
    }

    // Org admin has access to all tenants in their company
    if (user.is_org_admin) {
      const { data: tenant } = await supabaseAdmin
        .from('tenants')
        .select('parent_company_id')
        .eq('id', tenantId)
        .single();

      return tenant?.parent_company_id === user.company_id;
    }

    // Regular user only has access to their assigned tenant
    return user.tenant_id === tenantId;
  }

  /**
   * Get tenant usage statistics
   *
   * @param tenantId - Tenant ID
   */
  async getTenantUsageStats(tenantId: string): Promise<{
    userCount: number;
    apiCallsToday: number;
    apiCallsThisMonth: number;
  }> {
    // Get user count
    const { count: userCount } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    // Get API calls today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count: apiCallsToday } = await supabaseAdmin
      .from('api_usage')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('timestamp', todayStart.toISOString());

    // Get API calls this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { count: apiCallsThisMonth } = await supabaseAdmin
      .from('api_usage')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('timestamp', monthStart.toISOString());

    return {
      userCount: userCount || 0,
      apiCallsToday: apiCallsToday || 0,
      apiCallsThisMonth: apiCallsThisMonth || 0,
    };
  }
}

export const tenantService = new TenantService();
