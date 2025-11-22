/**
 * @file Cryptographic licensing system for NEEMIFY
 * @module services/licensing
 *
 * Implements banking-grade secure license generation, validation, and management.
 * Uses AES-256-GCM for encryption and HMAC-SHA256 for signing.
 */

import crypto from 'crypto';
import { config } from '../config';
import { supabaseAdmin } from '../config/database';
import { License, LicenseStatus, LicenseFeatures, Company } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * License payload structure before encryption
 */
interface LicensePayload {
  companyId: string;
  companyName: string;
  features: LicenseFeatures;
  issuedAt: number;
  expiresAt?: number;
  nonce: string; // Prevent replay attacks
}

/**
 * Licensing Service
 * Handles cryptographically secure license generation, validation, and revocation
 */
export class LicensingService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly encryptionKey: Buffer;
  private readonly signingKey: Buffer;

  constructor() {
    // Derive 32-byte encryption key from config
    this.encryptionKey = crypto
      .createHash('sha256')
      .update(config.license.encryptionKey)
      .digest();

    // Derive signing key
    this.signingKey = crypto
      .createHash('sha256')
      .update(config.license.signingKey)
      .digest();
  }

  /**
   * Generate a new cryptographically secure license for a company
   *
   * @param companyId - Company UUID
   * @param companyName - Company name
   * @param features - License features and limits
   * @param expiresInDays - Optional expiration in days (null = perpetual)
   * @returns Encrypted and signed license key
   */
  async generateLicense(
    companyId: string,
    companyName: string,
    features: LicenseFeatures,
    expiresInDays?: number
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresAt = expiresInDays ? issuedAt + expiresInDays * 24 * 60 * 60 * 1000 : undefined;

    const payload: LicensePayload = {
      companyId,
      companyName,
      features,
      issuedAt,
      expiresAt,
      nonce: uuidv4(), // Unique nonce for each license
    };

    // Encrypt the payload
    const encrypted = this.encryptPayload(payload);

    // Sign the encrypted data
    const signature = this.signData(encrypted);

    // Combine encrypted data and signature
    const licenseKey = `${encrypted}.${signature}`;

    // Store in database
    await this.storeLicense(companyId, licenseKey, features, expiresAt);

    return licenseKey;
  }

  /**
   * Validate a license key
   *
   * @param licenseKey - License key to validate
   * @returns Validation result with license details
   */
  async validateLicense(licenseKey: string): Promise<{
    valid: boolean;
    license?: License;
    payload?: LicensePayload;
    reason?: string;
  }> {
    try {
      // Split license key into encrypted data and signature
      const parts = licenseKey.split('.');
      if (parts.length !== 2) {
        return { valid: false, reason: 'Invalid license format' };
      }

      const [encrypted, signature] = parts;

      // Verify signature
      if (!this.verifySignature(encrypted, signature)) {
        return { valid: false, reason: 'Invalid license signature' };
      }

      // Decrypt payload
      const payload = this.decryptPayload(encrypted);

      // Check database for license status
      const { data: license, error } = await supabaseAdmin
        .from('licenses')
        .select('*')
        .eq('license_key', licenseKey)
        .single();

      if (error || !license) {
        return { valid: false, reason: 'License not found in database' };
      }

      // Check if revoked
      if (license.status === LicenseStatus.REVOKED) {
        return { valid: false, reason: 'License has been revoked', license };
      }

      // Check if suspended
      if (license.status === LicenseStatus.SUSPENDED) {
        return { valid: false, reason: 'License is suspended', license };
      }

      // Check expiration
      if (payload.expiresAt && Date.now() > payload.expiresAt) {
        // Update status to expired
        await this.updateLicenseStatus(license.id, LicenseStatus.EXPIRED);
        return { valid: false, reason: 'License has expired', license };
      }

      return { valid: true, license, payload };
    } catch (error) {
      return {
        valid: false,
        reason: `License validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Revoke a license permanently
   *
   * @param licenseId - License UUID
   */
  async revokeLicense(licenseId: string): Promise<void> {
    await supabaseAdmin
      .from('licenses')
      .update({
        status: LicenseStatus.REVOKED,
        revoked_at: new Date().toISOString(),
      })
      .eq('id', licenseId);

    // Also update company license status
    const { data: license } = await supabaseAdmin
      .from('licenses')
      .select('company_id')
      .eq('id', licenseId)
      .single();

    if (license) {
      await supabaseAdmin
        .from('companies')
        .update({ license_status: LicenseStatus.REVOKED })
        .eq('id', license.company_id);
    }
  }

  /**
   * Suspend a license temporarily
   *
   * @param licenseId - License UUID
   */
  async suspendLicense(licenseId: string): Promise<void> {
    await this.updateLicenseStatus(licenseId, LicenseStatus.SUSPENDED);
  }

  /**
   * Reactivate a suspended license
   *
   * @param licenseId - License UUID
   */
  async reactivateLicense(licenseId: string): Promise<void> {
    await this.updateLicenseStatus(licenseId, LicenseStatus.ACTIVE);
  }

  /**
   * Get license for a company
   *
   * @param companyId - Company UUID
   */
  async getLicenseByCompany(companyId: string): Promise<License | null> {
    const { data, error } = await supabaseAdmin
      .from('licenses')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', LicenseStatus.ACTIVE)
      .single();

    if (error || !data) {
      return null;
    }

    return data as License;
  }

  /**
   * Encrypt license payload using AES-256-GCM
   */
  private encryptPayload(payload: LicensePayload): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

    const payloadJson = JSON.stringify(payload);
    let encrypted = cipher.update(payloadJson, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Combine IV + encrypted data + auth tag
    return `${iv.toString('hex')}.${encrypted}.${authTag.toString('hex')}`;
  }

  /**
   * Decrypt license payload
   */
  private decryptPayload(encrypted: string): LicensePayload {
    const parts = encrypted.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted payload format');
    }

    const [ivHex, encryptedData, authTagHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }

  /**
   * Sign data using HMAC-SHA256
   */
  private signData(data: string): string {
    const hmac = crypto.createHmac('sha256', this.signingKey);
    hmac.update(data);
    return hmac.digest('hex');
  }

  /**
   * Verify signature
   */
  private verifySignature(data: string, signature: string): boolean {
    const expectedSignature = this.signData(data);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }

  /**
   * Store license in database
   */
  private async storeLicense(
    companyId: string,
    licenseKey: string,
    features: LicenseFeatures,
    expiresAt?: number
  ): Promise<void> {
    const signature = this.signData(licenseKey);

    await supabaseAdmin.from('licenses').insert({
      id: uuidv4(),
      company_id: companyId,
      license_key: licenseKey,
      status: LicenseStatus.ACTIVE,
      features,
      issued_at: new Date().toISOString(),
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      signature,
    });

    // Update company with license key
    await supabaseAdmin
      .from('companies')
      .update({
        license_key: licenseKey,
        license_status: LicenseStatus.ACTIVE,
      })
      .eq('id', companyId);
  }

  /**
   * Update license status
   */
  private async updateLicenseStatus(licenseId: string, status: LicenseStatus): Promise<void> {
    await supabaseAdmin.from('licenses').update({ status }).eq('id', licenseId);

    // Also update company
    const { data: license } = await supabaseAdmin
      .from('licenses')
      .select('company_id')
      .eq('id', licenseId)
      .single();

    if (license) {
      await supabaseAdmin
        .from('companies')
        .update({ license_status: status })
        .eq('id', license.company_id);
    }
  }
}

export const licensingService = new LicensingService();
