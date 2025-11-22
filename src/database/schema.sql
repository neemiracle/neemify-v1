-- NEEMIFY Medical OS API Infrastructure - Database Schema
-- This schema implements a secure multi-tenant architecture with hierarchical tenants

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- COMPANIES (Top-level Tenants)
-- ============================================================================

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL UNIQUE,
    license_key TEXT NOT NULL UNIQUE,
    license_status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_license_status CHECK (license_status IN ('active', 'expired', 'suspended', 'revoked'))
);

CREATE INDEX idx_companies_domain ON companies(domain);
CREATE INDEX idx_companies_license_status ON companies(license_status);

-- ============================================================================
-- TENANTS (Child Tenants - managed by partner organizations)
-- ============================================================================

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100),
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tenants_parent_company ON tenants(parent_company_id);
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);

-- ============================================================================
-- USERS
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    is_super_user BOOLEAN DEFAULT false,
    is_org_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_super_user ON users(is_super_user) WHERE is_super_user = true;

-- ============================================================================
-- LICENSES
-- ============================================================================

CREATE TABLE licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    license_key TEXT NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    features JSONB NOT NULL DEFAULT '{}',
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    signature TEXT NOT NULL,
    CONSTRAINT valid_license_status CHECK (status IN ('active', 'expired', 'suspended', 'revoked'))
);

CREATE INDEX idx_licenses_company ON licenses(company_id);
CREATE INDEX idx_licenses_key ON licenses(license_key);
CREATE INDEX idx_licenses_status ON licenses(status);

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_permissions_resource ON permissions(resource);
CREATE INDEX idx_permissions_name ON permissions(name);

-- ============================================================================
-- ROLES (Dynamic, Company-specific)
-- ============================================================================

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, name)
);

CREATE INDEX idx_roles_company ON roles(company_id);

-- ============================================================================
-- ROLE PERMISSIONS (Many-to-Many)
-- ============================================================================

CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

-- ============================================================================
-- USER ROLES (Many-to-Many)
-- ============================================================================

CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);

-- ============================================================================
-- API USAGE TRACKING
-- ============================================================================

CREATE TABLE api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    response_status INTEGER NOT NULL,
    response_time_ms INTEGER NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_api_usage_company ON api_usage(company_id);
CREATE INDEX idx_api_usage_tenant ON api_usage(tenant_id);
CREATE INDEX idx_api_usage_timestamp ON api_usage(timestamp);
CREATE INDEX idx_api_usage_endpoint ON api_usage(endpoint);

-- ============================================================================
-- AUDIT LOGS
-- ============================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id UUID,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_company ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Super User has access to everything
CREATE POLICY super_user_all ON companies FOR ALL
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_super_user = true));

CREATE POLICY super_user_all ON tenants FOR ALL
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_super_user = true));

CREATE POLICY super_user_all ON users FOR ALL
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_super_user = true));

-- Company isolation: Users can only see their own company data
CREATE POLICY company_isolation ON companies FOR SELECT
    USING (id = (SELECT company_id FROM users WHERE users.id = auth.uid()));

CREATE POLICY tenant_isolation ON tenants FOR SELECT
    USING (
        parent_company_id = (SELECT company_id FROM users WHERE users.id = auth.uid())
        OR id = (SELECT tenant_id FROM users WHERE users.id = auth.uid())
    );

CREATE POLICY user_isolation ON users FOR SELECT
    USING (
        company_id = (SELECT company_id FROM users WHERE users.id = auth.uid())
    );

-- Organization Admin can manage tenants in their company
CREATE POLICY org_admin_manage_tenants ON tenants FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_org_admin = true
            AND users.company_id = tenants.parent_company_id
        )
    );

-- Organization Admin can manage users in their company
CREATE POLICY org_admin_manage_users ON users FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.is_org_admin = true
            AND u.company_id = users.company_id
        )
    );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to prevent multiple super users
CREATE OR REPLACE FUNCTION enforce_single_super_user()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_super_user = true THEN
        IF EXISTS (SELECT 1 FROM users WHERE is_super_user = true AND id != NEW.id) THEN
            RAISE EXCEPTION 'Only one super user is allowed in the system';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_super_user BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION enforce_single_super_user();

-- ============================================================================
-- SEED DEFAULT PERMISSIONS
-- ============================================================================

INSERT INTO permissions (name, resource, action, description) VALUES
-- Company management
('company.read', 'company', 'read', 'View company information'),
('company.update', 'company', 'update', 'Update company settings'),
('company.delete', 'company', 'delete', 'Delete company'),

-- Tenant management
('tenant.create', 'tenant', 'create', 'Create child tenants'),
('tenant.read', 'tenant', 'read', 'View tenant information'),
('tenant.update', 'tenant', 'update', 'Update tenant settings'),
('tenant.delete', 'tenant', 'delete', 'Delete tenant'),

-- User management
('user.create', 'user', 'create', 'Invite and create users'),
('user.read', 'user', 'read', 'View user information'),
('user.update', 'user', 'update', 'Update user details'),
('user.delete', 'user', 'delete', 'Delete users'),

-- Role management
('role.create', 'role', 'create', 'Create custom roles'),
('role.read', 'role', 'read', 'View roles'),
('role.update', 'role', 'update', 'Update role permissions'),
('role.delete', 'role', 'delete', 'Delete roles'),
('role.assign', 'role', 'assign', 'Assign roles to users'),

-- License management
('license.read', 'license', 'read', 'View license information'),
('license.update', 'license', 'update', 'Update license'),
('license.revoke', 'license', 'revoke', 'Revoke license'),

-- API access
('api.use', 'api', 'use', 'Access NEEMIFY APIs'),

-- Audit logs
('audit.read', 'audit', 'read', 'View audit logs');
