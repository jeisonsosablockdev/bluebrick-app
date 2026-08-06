/**
 * Global RBAC Permission Guards (Role-Based Access Control)
 */

export type UserRole = 'admin' | 'operator' | 'investor';

export interface RbacGuardContext {
  userRole: UserRole;
  requiredRole: UserRole;
}

export function hasRequiredRole(userRole: UserRole, requiredRole: UserRole): boolean {
  if (userRole === 'admin') return true;
  if (userRole === 'operator' && (requiredRole === 'operator' || requiredRole === 'investor')) return true;
  if (userRole === 'investor' && requiredRole === 'investor') return true;
  return false;
}

export function assertAdminAuthority(userRole: UserRole): void {
  if (userRole !== 'admin') {
    throw new Error('Access Denied: Admin authority required.');
  }
}
