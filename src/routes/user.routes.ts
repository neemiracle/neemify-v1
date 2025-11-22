/**
 * @file User management routes
 * @module routes/user
 */

import { Router, Request, Response } from 'express';
import { userService } from '../services/user.service';
import { rbacService } from '../services/rbac.service';
import { authenticate, requirePermission, requireSuperUser, requireOrgAdmin } from '../middleware/auth.middleware';
import { createAuditLogEntry } from '../middleware/audit.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/users
 * Get all users (filtered by permissions)
 */
router.get('/', requirePermission('user.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const filters: any = {};

    // If not super user, filter by company
    if (!req.context!.user.is_super_user) {
      filters.companyId = req.context!.company.id;
    }

    // Optional query filters
    if (req.query.companyId) {
      filters.companyId = req.query.companyId as string;
    }

    if (req.query.tenantId) {
      filters.tenantId = req.query.tenantId as string;
    }

    const users = await userService.getAllUsers(filters);
    res.json(users);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/users/:id
 * Get specific user details
 */
router.get('/:id', requirePermission('user.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await userService.getUserById(req.params.id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if user has access to this user's company
    if (!req.context!.user.is_super_user && user.company_id !== req.context!.company.id) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch user',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/users
 * Create new user
 */
router.post('/', requirePermission('user.create'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName, tenantId, isOrgAdmin } = req.body;

    if (!email || !password || !fullName) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Use authenticated user's company
    const companyId = req.context!.company.id;

    const result = await userService.createUser({
      email,
      password,
      fullName,
      companyId,
      tenantId,
      isOrgAdmin: isOrgAdmin || false,
    });

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    // Audit log
    await createAuditLogEntry(
      req.context!.user.id,
      req.context!.company.id,
      'user.create',
      'user',
      result.userId!,
      { email, fullName },
      req
    );

    res.status(201).json({
      message: 'User created successfully',
      userId: result.userId,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create user',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PATCH /api/users/:id
 * Update user
 */
router.patch('/:id', requirePermission('user.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await userService.updateUser(req.params.id, req.body);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    // Audit log
    await createAuditLogEntry(
      req.context!.user.id,
      req.context!.company.id,
      'user.update',
      'user',
      req.params.id,
      req.body,
      req
    );

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update user',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/users/:id
 * Delete user
 */
router.delete('/:id', requirePermission('user.delete'), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await userService.deleteUser(req.params.id);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    // Audit log
    await createAuditLogEntry(
      req.context!.user.id,
      req.context!.company.id,
      'user.delete',
      'user',
      req.params.id,
      {},
      req
    );

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete user',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/users/:id/roles
 * Get user's roles and permissions
 */
router.get('/:id/roles', requirePermission('user.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { roles, permissions } = await rbacService.getUserRolesAndPermissions(req.params.id);
    res.json({ roles, permissions });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch user roles',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/users/:id/roles
 * Assign role to user
 */
router.post('/:id/roles', requirePermission('role.assign'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { roleId } = req.body;

    if (!roleId) {
      res.status(400).json({ error: 'Role ID is required' });
      return;
    }

    const result = await rbacService.assignRoleToUser(
      req.params.id,
      roleId,
      req.context!.user.id
    );

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    // Audit log
    await createAuditLogEntry(
      req.context!.user.id,
      req.context!.company.id,
      'role.assign',
      'user',
      req.params.id,
      { roleId },
      req
    );

    res.json({ message: 'Role assigned successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to assign role',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/users/:id/roles/:roleId
 * Remove role from user
 */
router.delete('/:id/roles/:roleId', requirePermission('role.assign'), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await rbacService.removeRoleFromUser(req.params.id, req.params.roleId);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    // Audit log
    await createAuditLogEntry(
      req.context!.user.id,
      req.context!.company.id,
      'role.remove',
      'user',
      req.params.id,
      { roleId: req.params.roleId },
      req
    );

    res.json({ message: 'Role removed successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to remove role',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
