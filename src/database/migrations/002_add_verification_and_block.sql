-- Migration: Add domain verification and company block features
-- Created: 2025-11-22

-- Add domain verification columns
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS domain_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS domain_verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- Add company block columns
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
ADD COLUMN IF NOT EXISTS blocked_by_user_id UUID;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_companies_domain_verified ON companies(domain_verified);
CREATE INDEX IF NOT EXISTS idx_companies_is_blocked ON companies(is_blocked);

-- Update existing companies to be verified (since they were created before this feature)
UPDATE companies SET domain_verified = true, verified_at = created_at WHERE domain_verified = false;
