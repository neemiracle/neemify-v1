/**
 * @file Authentication service for NEEMIFY
 * @module services/auth
 *
 * Handles user authentication, JWT generation, and super user setup
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { supabase, supabaseAdmin } from '../config/database';
import { config } from '../config';
import { User, JwtPayload } from '../types';

const SALT_ROUNDS = 12;

/**
 * Authentication Service
 * Provides secure authentication with bcrypt password hashing and JWT tokens
 */
export class AuthService {
  /**
   * Initialize super user (one-time setup)
   * This should only be called during initial system setup
   */
  async initializeSuperUser(): Promise<{ success: boolean; message: string }> {
    try {
      // Check if super user already exists
      const { data: existingSuperUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('is_super_user', true)
        .single();

      if (existingSuperUser) {
        return { success: false, message: 'Super user already exists' };
      }

      // Create a special company for the super user
      const superCompanyId = uuidv4();
      const { error: companyError } = await supabaseAdmin.from('companies').insert({
        id: superCompanyId,
        name: 'NEEMIFY System',
        domain: 'neemify.system',
        license_key: 'SYSTEM-LICENSE',
        license_status: 'active',
      });

      if (companyError) {
        throw new Error(`Failed to create system company: ${companyError.message}`);
      }

      // Hash password
      const passwordHash = await bcrypt.hash(config.superUser.password, SALT_ROUNDS);

      // Create super user
      const superUserId = uuidv4();
      const { error: userError } = await supabaseAdmin.from('users').insert({
        id: superUserId,
        email: config.superUser.email,
        full_name: 'System Administrator',
        password_hash: passwordHash,
        company_id: superCompanyId,
        is_super_user: true,
        is_org_admin: true,
      });

      if (userError) {
        throw new Error(`Failed to create super user: ${userError.message}`);
      }

      return {
        success: true,
        message: 'Super user created successfully. Please change the password immediately.',
      };
    } catch (error) {
      return {
        success: false,
        message: `Super user initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Register a new user
   *
   * @param email - User email
   * @param password - User password
   * @param fullName - User's full name
   * @param companyId - Company ID (must be set after domain validation)
   * @param isOrgAdmin - Whether user is organization admin (first user in company)
   */
  async register(
    email: string,
    password: string,
    fullName: string,
    companyId: string,
    isOrgAdmin: boolean = false
  ): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Create user
      const userId = uuidv4();
      const { error } = await supabaseAdmin.from('users').insert({
        id: userId,
        email,
        full_name: fullName,
        password_hash: passwordHash,
        company_id: companyId,
        is_super_user: false,
        is_org_admin: isOrgAdmin,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, userId };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }

  /**
   * Authenticate user and generate JWT token
   *
   * @param email - User email
   * @param password - User password
   */
  async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; token?: string; user?: User; error?: string }> {
    try {
      // Get user from database
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Verify password
      const passwordValid = await bcrypt.compare(password, user.password_hash);
      if (!passwordValid) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Get user permissions
      const permissions = await this.getUserPermissions(user.id);

      // Generate JWT token
      const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
        companyId: user.company_id,
        tenantId: user.tenant_id,
        isSuperUser: user.is_super_user,
        isOrgAdmin: user.is_org_admin,
        permissions,
      };

      const token = jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn as string,
      } as any);

      // Update last login
      await supabaseAdmin
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      return { success: true, token, user };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  /**
   * Verify JWT token
   *
   * @param token - JWT token
   */
  verifyToken(token: string): JwtPayload | null {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get user permissions from roles
   *
   * @param userId - User ID
   */
  private async getUserPermissions(userId: string): Promise<string[]> {
    const { data: userRoles } = await supabaseAdmin
      .from('user_roles')
      .select(
        `
        role_id,
        roles!inner (
          id,
          role_permissions!inner (
            permission_id,
            permissions!inner (
              name
            )
          )
        )
      `
      )
      .eq('user_id', userId);

    if (!userRoles) {
      return [];
    }

    // Extract unique permission names
    const permissions = new Set<string>();
    userRoles.forEach((userRole: any) => {
      userRole.roles?.role_permissions?.forEach((rp: any) => {
        if (rp.permissions?.name) {
          permissions.add(rp.permissions.name);
        }
      });
    });

    return Array.from(permissions);
  }

  /**
   * Change user password
   *
   * @param userId - User ID
   * @param oldPassword - Current password
   * @param newPassword - New password
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current user
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('password_hash')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return { success: false, error: 'User not found' };
      }

      // Verify old password
      const passwordValid = await bcrypt.compare(oldPassword, user.password_hash);
      if (!passwordValid) {
        return { success: false, error: 'Current password is incorrect' };
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

      // Update password
      await supabaseAdmin
        .from('users')
        .update({ password_hash: newPasswordHash })
        .eq('id', userId);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Password change failed',
      };
    }
  }
}

export const authService = new AuthService();
