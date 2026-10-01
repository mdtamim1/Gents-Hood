import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export type AdminPermissionKey = 'dashboard' | 'orders' | 'products' | 'analytics' | 'settings';

export function parsePermissions(raw: string | null | undefined): Record<string, boolean> {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function hasPermission(
  user: { role: string; permissions?: string | null | Record<string, boolean> },
  permissionKey: AdminPermissionKey
): boolean {
  if (user.role === 'OWNER') return true;
  const perms =
    typeof user.permissions === 'string'
      ? parsePermissions(user.permissions)
      : user.permissions || {};
  return !!perms[permissionKey];
}

export function getFirstAllowedPath(user: {
  role: string;
  permissions?: string | null | Record<string, boolean>;
}): string {
  if (user.role === 'OWNER') return '/admin/dashboard';
  const perms =
    typeof user.permissions === 'string'
      ? parsePermissions(user.permissions)
      : user.permissions || {};

  if (perms.dashboard) return '/admin/dashboard';
  if (perms.orders) return '/admin/orders';
  if (perms.products) return '/admin/products';
  if (perms.analytics) return '/admin/analytics';
  if (perms.settings) return '/admin/site-settings';
  return '/admin/orders';
}

export async function verifyAdminAccess(requiredPermission?: AdminPermissionKey) {
  const session = await getAdminSession();
  if (!session) {
    return { authorized: false as const, reason: 'unauthorized', user: null, session: null };
  }

  const user = await db.adminUser.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      permissions: true,
      sessionToken: true,
    },
  });

  if (!user || !user.isActive) {
    return { authorized: false as const, reason: 'deactivated', user: null, session };
  }

  if (session.sessionToken && user.sessionToken !== session.sessionToken) {
    return { authorized: false as const, reason: 'session_expired', user: null, session };
  }

  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return {
      authorized: false as const,
      reason: 'forbidden',
      user,
      session,
      fallbackUrl: getFirstAllowedPath(user),
    };
  }

  return { authorized: true as const, user, session };
}
