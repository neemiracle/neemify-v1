/**
 * @file Core type definitions for NEEMIFY Medical OS API Infrastructure
 * @module types
 */

/**
 * User role in the system
 */
export interface Role {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  permissions: string[];
  created_at: Date;
  updated_at: Date;
}

/**
 * User entity
 */
export interface User {
  id: string;
  email: string;
  full_name: string;
  company_id: string;
  tenant_id?: string;
  is_super_user: boolean;
  is_org_admin: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

/**
 * User-Role association
 */
export interface UserRole {
  user_id: string;
  role_id: string;
  assigned_at: Date;
  assigned_by: string;
}

/**
 * Company/Organization entity (Top-level tenant)
 */
export interface Company {
  id: string;
  name: string;
  domain: string;
  license_key: string;
  license_status: LicenseStatus;
  domain_verified?: boolean;
  domain_verification_token?: string;
  verified_at?: Date;
  is_blocked?: boolean;
  blocked_at?: Date;
  blocked_reason?: string;
  blocked_by_user_id?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Child Tenant entity (Managed by partner organizations)
 */
export interface Tenant {
  id: string;
  parent_company_id: string;
  name: string;
  subdomain?: string;
  settings: Record<string, unknown>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * License status enum
 */
export enum LicenseStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
  REVOKED = 'revoked',
}

/**
 * License feature flags
 */
export interface LicenseFeatures {
  max_users?: number;
  max_tenants?: number;
  api_rate_limit?: number;
  enabled_modules: string[];
  custom_features: Record<string, boolean>;
}

/**
 * License entity
 */
export interface License {
  id: string;
  company_id: string;
  license_key: string;
  status: LicenseStatus;
  features: LicenseFeatures;
  issued_at: Date;
  expires_at?: Date;
  revoked_at?: Date;
  signature: string;
}

/**
 * Permission entity
 */
export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

/**
 * API usage tracking
 */
export interface ApiUsage {
  id: string;
  company_id: string;
  tenant_id?: string;
  endpoint: string;
  method: string;
  timestamp: Date;
  user_id: string;
  response_status: number;
  response_time_ms: number;
}

/**
 * Audit log entry
 */
export interface AuditLog {
  id: string;
  user_id: string;
  company_id: string;
  tenant_id?: string;
  action: string;
  resource: string;
  resource_id?: string;
  changes?: Record<string, unknown>;
  ip_address: string;
  user_agent: string;
  timestamp: Date;
}

/**
 * JWT payload structure
 */
export interface JwtPayload {
  userId: string;
  email: string;
  companyId: string;
  tenantId?: string;
  isSuperUser: boolean;
  isOrgAdmin: boolean;
  permissions: string[];
  iat?: number;
  exp?: number;
}

/**
 * API Request context
 */
export interface RequestContext {
  user: User;
  company: Company;
  tenant?: Tenant;
  license: License;
  permissions: Set<string>;
}

/**
 * Domain validation result
 */
export interface DomainValidationResult {
  exists: boolean;
  company?: Company;
  requiresApproval: boolean;
}
