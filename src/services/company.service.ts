/**
 * @file Company management and domain validation service
 * @module services/company
 *
 * Handles company creation, domain validation, and organization management
 */

import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/database';
import { Company, DomainValidationResult, LicenseFeatures } from '../types';
import { licensingService } from './licensing.service';

/**
 * Company Service
 * Manages organizations and domain-based signup validation
 */
export class CompanyService {
  /**
   * Extract domain from email address
   *
   * @param email - Email address
   */
  private extractDomain(email: string): string {
    return email.split('@')[1].toLowerCase();
  }

  /**
   * Validate domain and check if company exists
   *
   * @param email - User email
   */
  async validateDomain(email: string): Promise<DomainValidationResult> {
    const domain = this.extractDomain(email);

    const { data: company, error } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('domain', domain)
      .single();

    if (error || !company) {
      return {
        exists: false,
        requiresApproval: false,
      };
    }

    return {
      exists: true,
      company: company as Company,
      requiresApproval: true,
    };
  }

  /**
   * Create a new company with license
   *
   * @param name - Company name
   * @param domain - Company domain
   * @param features - License features
   * @param expiresInDays - License expiration (optional)
   */
  async createCompany(
    name: string,
    domain: string,
    features: LicenseFeatures,
    expiresInDays?: number
  ): Promise<{ success: boolean; company?: Company; licenseKey?: string; error?: string }> {
    try {
      // Check if domain already exists
      const { data: existingCompany } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('domain', domain)
        .single();

      if (existingCompany) {
        return { success: false, error: 'Company with this domain already exists' };
      }

      // Create company
      const companyId = uuidv4();

      // Generate license
      const licenseKey = await licensingService.generateLicense(
        companyId,
        name,
        features,
        expiresInDays
      );

      // Insert company (license is already stored by licensingService)
      const { data: company, error } = await supabaseAdmin
        .from('companies')
        .insert({
          id: companyId,
          name,
          domain,
          license_key: licenseKey,
          license_status: 'active',
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, company: company as Company, licenseKey };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create company',
      };
    }
  }

  /**
   * Get company by ID
   *
   * @param companyId - Company ID
   */
  async getCompanyById(companyId: string): Promise<Company | null> {
    const { data: company, error } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (error || !company) {
      return null;
    }

    return company as Company;
  }

  /**
   * Get company by domain
   *
   * @param domain - Company domain
   */
  async getCompanyByDomain(domain: string): Promise<Company | null> {
    const { data: company, error } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('domain', domain)
      .single();

    if (error || !company) {
      return null;
    }

    return company as Company;
  }

  /**
   * Update company details
   *
   * @param companyId - Company ID
   * @param updates - Fields to update
   */
  async updateCompany(
    companyId: string,
    updates: Partial<Omit<Company, 'id' | 'created_at'>>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseAdmin
        .from('companies')
        .update(updates)
        .eq('id', companyId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update company',
      };
    }
  }

  /**
   * Get all users in a company
   *
   * @param companyId - Company ID
   */
  async getCompanyUsers(companyId: string): Promise<any[]> {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, is_org_admin, tenant_id, created_at, last_login')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error || !users) {
      return [];
    }

    return users;
  }

  /**
   * Get organization admin for a company
   *
   * @param companyId - Company ID
   */
  async getOrgAdmin(companyId: string): Promise<any | null> {
    const { data: admin, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name')
      .eq('company_id', companyId)
      .eq('is_org_admin', true)
      .single();

    if (error || !admin) {
      return null;
    }

    return admin;
  }

  /**
   * Request access to join an existing company
   * (In a real implementation, this would create a pending request)
   *
   * @param companyId - Company ID to join
   * @param userEmail - Requesting user's email
   */
  async requestCompanyAccess(
    companyId: string,
    userEmail: string
  ): Promise<{ success: boolean; message: string; adminEmail?: string }> {
    const admin = await this.getOrgAdmin(companyId);

    if (!admin) {
      return {
        success: false,
        message: 'No organization admin found for this company',
      };
    }

    // In a real implementation, send email notification to admin
    // For now, just return admin contact info
    return {
      success: true,
      message: 'Access request submitted. Please contact your organization admin.',
      adminEmail: admin.email,
    };
  }

  /**
   * Get company usage statistics
   *
   * @param companyId - Company ID
   */
  async getCompanyUsageStats(companyId: string): Promise<{
    userCount: number;
    tenantCount: number;
    apiCallsToday: number;
    apiCallsThisMonth: number;
  }> {
    // Get user count
    const { count: userCount } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId);

    // Get tenant count
    const { count: tenantCount } = await supabaseAdmin
      .from('tenants')
      .select('id', { count: 'exact', head: true })
      .eq('parent_company_id', companyId);

    // Get API calls today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count: apiCallsToday } = await supabaseAdmin
      .from('api_usage')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .gte('timestamp', todayStart.toISOString());

    // Get API calls this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { count: apiCallsThisMonth } = await supabaseAdmin
      .from('api_usage')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .gte('timestamp', monthStart.toISOString());

    return {
      userCount: userCount || 0,
      tenantCount: tenantCount || 0,
      apiCallsToday: apiCallsToday || 0,
      apiCallsThisMonth: apiCallsThisMonth || 0,
    };
  }
}

export const companyService = new CompanyService();
