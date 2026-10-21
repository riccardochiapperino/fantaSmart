import { UserAccount, UserRole } from './mockAccounts';

export function isAuthenticated(user: UserAccount | null): boolean {
  return user !== null && typeof user.id === 'string';
}

export function hasRole(user: UserAccount | null, role: UserRole): boolean {
  if (!isAuthenticated(user) || !user) return false;
  return user.role === role;
}

export function isAdmin(user: UserAccount | null): boolean {
  return hasRole(user, 'ADMIN');
}

export function requireAdmin(user: UserAccount | null): void {
  if (!isAdmin(user)) {
    throw new Error('ACCESSO NEGATO: Questa azione richiede privilegi di AMMINISTRATORE (ADMIN).');
  }
}
