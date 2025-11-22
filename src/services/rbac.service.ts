/**
 * @file Role-Based Access Control (RBAC) service
 * @module services/rbac
 *
 * Dynamic permission and role management system
 */

import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/database';
import { Role, Permission, User } from '../types';

/**
 * RBAC Service
 * Manages dynamic roles and permissions
 */
export class RBACService {
  /**
   * Create a new role in a company
   *
   * @param companyId - Company ID
   * @param name - Role name
   * @param description - Role description
   * @param permissionIds - Array of permission IDs to assign
   */
  async createRole(
    companyId: string,
    name: string,
    description: string,
    permissionIds: string[] = []
  ): Promise<{ success: boolean; role?: Role; error?: string }> {
    try {
      // Create role
      const roleId = uuidv4();
      const { data: role, error } = await supabaseAdmin
        .from('roles')
        .insert({
          id: roleId,
          company_id: companyId,
          name,
          description,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Assign permissions to role
      if (permissionIds.length > 0) {
        await this.assignPermissionsToRole(roleId, permissionIds);
      }

      return { success: true, role: role as Role };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create role',
      };
    }
  }

  /**
   * Assign permissions to a role
   *
   * @param roleId - Role ID
   * @param permissionIds - Array of permission IDs
   */
  async assignPermissionsToRole(
    roleId: string,
    permissionIds: string[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Remove existing permissions
      await supabaseAdmin.from('role_permissions').delete().eq('role_id', roleId);

      // Add new permissions
      const rolePermissions = permissionIds.map((permissionId) => ({
        role_id: roleId,
        permission_id: permissionId,
      }));

      const { error } = await supabaseAdmin.from('role_permissions').insert(rolePermissions);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign permissions',
      };
    }
  }

  /**
   * Assign a role to a user
   *
   * @param userId - User ID
   * @param roleId - Role ID
   * @param assignedBy - User ID of the person assigning the role
   */
  async assignRoleToUser(
    userId: string,
    roleId: string,
    assignedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseAdmin.from('user_roles').insert({
        user_id: userId,
        role_id: roleId,
        assigned_by: assignedBy,
      });

      if (error) {
        // Check if role is already assigned
        if (error.code === '23505') {
          return { success: false, error: 'Role already assigned to user' };
        }
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign role',
      };
    }
  }

  /**
   * Remove a role from a user
   *
   * @param userId - User ID
   * @param roleId - Role ID
   */
  async removeRoleFromUser(
    userId: string,
    roleId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role_id', roleId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove role',
      };
    }
  }

  /**
   * Get all roles for a company
   *
   * @param companyId - Company ID
   */
  async getCompanyRoles(companyId: string): Promise<Role[]> {
    const { data: roles, error } = await supabaseAdmin
      .from('roles')
      .select('*')
      .eq('company_id', companyId)
      .order('name');

    if (error || !roles) {
      return [];
    }

    return roles as Role[];
  }

  /**
   * Get role with its permissions
   *
   * @param roleId - Role ID
   */
  async getRoleWithPermissions(roleId: string): Promise<{
    role: Role | null;
    permissions: Permission[];
  }> {
    const { data: role } = await supabaseAdmin.from('roles').select('*').eq('id', roleId).single();

    if (!role) {
      return { role: null, permissions: [] };
    }

    const { data: rolePermissions } = await supabaseAdmin
      .from('role_permissions')
      .select(
        `
        permissions (
          id,
          name,
          resource,
          action,
          description
        )
      `
      )
      .eq('role_id', roleId);

    const permissions = rolePermissions?.map((rp: any) => rp.permissions).filter(Boolean) || [];

    return { role: role as Role, permissions };
  }

  /**
   * Get all permissions available in the system
   */
  async getAllPermissions(): Promise<Permission[]> {
    const { data: permissions, error } = await supabaseAdmin
      .from('permissions')
      .select('*')
      .order('resource', { ascending: true })
      .order('action', { ascending: true });

    if (error || !permissions) {
      return [];
    }

    return permissions as Permission[];
  }

  /**
   * Get user's roles and permissions
   *
   * @param userId - User ID
   */
  async getUserRolesAndPermissions(userId: string): Promise<{
    roles: Role[];
    permissions: Permission[];
  }> {
    const { data: userRoles } = await supabaseAdmin
      .from('user_roles')
      .select(
        `
        roles (
          id,
          company_id,
          name,
          description,
          created_at,
          updated_at
        )
      `
      )
      .eq('user_id', userId);

    const roles = userRoles?.map((ur: any) => ur.roles).filter(Boolean) || [];

    // Get all permissions from all roles
    const permissionSet = new Set<string>();
    const permissionsMap = new Map<string, Permission>();

    for (const role of roles) {
      const { permissions } = await this.getRoleWithPermissions(role.id);
      permissions.forEach((perm) => {
        if (!permissionSet.has(perm.id)) {
          permissionSet.add(perm.id);
          permissionsMap.set(perm.id, perm);
        }
      });
    }

    return {
      roles: roles as Role[],
      permissions: Array.from(permissionsMap.values()),
    };
  }

  /**
   * Check if user has a specific permission
   *
   * @param userId - User ID
   * @param permissionName - Permission name (e.g., 'user.create')
   */
  async userHasPermission(userId: string, permissionName: string): Promise<boolean> {
    // Check if super user
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('is_super_user')
      .eq('id', userId)
      .single();

    if (user?.is_super_user) {
      return true; // Super user has all permissions
    }

    const { permissions } = await this.getUserRolesAndPermissions(userId);
    return permissions.some((perm) => perm.name === permissionName);
  }

  /**
   * Update role details
   *
   * @param roleId - Role ID
   * @param updates - Fields to update
   */
  async updateRole(
    roleId: string,
    updates: { name?: string; description?: string }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseAdmin.from('roles').update(updates).eq('id', roleId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update role',
      };
    }
  }

  /**
   * Delete a role
   *
   * @param roleId - Role ID
   */
  async deleteRole(roleId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if role is assigned to any users
      const { count } = await supabaseAdmin
        .from('user_roles')
        .select('user_id', { count: 'exact', head: true })
        .eq('role_id', roleId);

      if (count && count > 0) {
        return {
          success: false,
          error: `Cannot delete role: assigned to ${count} user(s)`,
        };
      }

      const { error } = await supabaseAdmin.from('roles').delete().eq('id', roleId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete role',
      };
    }
  }

  /**
   * Create a default set of roles for a new company
   *
   * @param companyId - Company ID
   */
  async createDefaultRoles(companyId: string): Promise<void> {
    // Get all permissions
    const allPermissions = await this.getAllPermissions();

    // Admin role - all permissions
    const adminPermissions = allPermissions.map((p) => p.id);
    await this.createRole(companyId, 'Admin', 'Full administrative access', adminPermissions);

    // Operator role - limited permissions
    const operatorPermissions = allPermissions
      .filter(
        (p) =>
          p.name.includes('.read') ||
          p.name.includes('.create') ||
          p.name === 'api.use' ||
          p.name === 'user.read'
      )
      .map((p) => p.id);
    await this.createRole(companyId, 'Operator', 'Operational access', operatorPermissions);

    // Viewer role - read-only
    const viewerPermissions = allPermissions
      .filter((p) => p.name.includes('.read') || p.name === 'api.use')
      .map((p) => p.id);
    await this.createRole(companyId, 'Viewer', 'Read-only access', viewerPermissions);
  }
}

export const rbacService = new RBACService();
