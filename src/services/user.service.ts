/**
 * @file User management service
 * @module services/user
 */

import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { supabaseAdmin } from '../config/database';

const SALT_ROUNDS = 12;

/**
 * User Service
 * Manages user CRUD operations
 */
export class UserService {
  /**
   * Get all users (with optional filtering)
   */
  async getAllUsers(filters?: {
    companyId?: string;
    tenantId?: string;
    isOrgAdmin?: boolean;
  }) {
    let query = supabaseAdmin
      .from('users')
      .select('id, email, full_name, company_id, tenant_id, is_org_admin, is_super_user, created_at, last_login')
      .order('created_at', { ascending: false });

    if (filters?.companyId) {
      query = query.eq('company_id', filters.companyId);
    }

    if (filters?.tenantId) {
      query = query.eq('tenant_id', filters.tenantId);
    }

    if (filters?.isOrgAdmin !== undefined) {
      query = query.eq('is_org_admin', filters.isOrgAdmin);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, company_id, tenant_id, is_org_admin, is_super_user, created_at, last_login')
      .eq('id', userId)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  /**
   * Create a new user
   */
  async createUser(data: {
    email: string;
    password: string;
    fullName: string;
    companyId: string;
    tenantId?: string;
    isOrgAdmin?: boolean;
  }) {
    try {
      // Hash password
      const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

      const userId = uuidv4();
      const { error } = await supabaseAdmin.from('users').insert({
        id: userId,
        email: data.email,
        full_name: data.fullName,
        password_hash: passwordHash,
        company_id: data.companyId,
        tenant_id: data.tenantId || null,
        is_org_admin: data.isOrgAdmin || false,
        is_super_user: false,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, userId };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create user',
      };
    }
  }

  /**
   * Update user details
   */
  async updateUser(userId: string, updates: {
    fullName?: string;
    email?: string;
    tenantId?: string;
    isOrgAdmin?: boolean;
  }) {
    try {
      const updateData: any = {};

      if (updates.fullName) updateData.full_name = updates.fullName;
      if (updates.email) updateData.email = updates.email;
      if (updates.tenantId !== undefined) updateData.tenant_id = updates.tenantId;
      if (updates.isOrgAdmin !== undefined) updateData.is_org_admin = updates.isOrgAdmin;

      const { error } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user',
      };
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string) {
    try {
      // Check if user is super user
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('is_super_user')
        .eq('id', userId)
        .single();

      if (user?.is_super_user) {
        return { success: false, error: 'Cannot delete super user' };
      }

      const { error } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete user',
      };
    }
  }

  /**
   * Get user count by company
   */
  async getUserCountByCompany(companyId: string): Promise<number> {
    const { count } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId);

    return count || 0;
  }

  /**
   * Get total user count
   */
  async getTotalUserCount(): Promise<number> {
    const { count } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true });

    return count || 0;
  }
}

export const userService = new UserService();
