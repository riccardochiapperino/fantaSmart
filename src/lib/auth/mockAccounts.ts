export type UserRole = 'ADMIN' | 'USER';

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isGuest?: boolean;
  activeAuctionId?: string;
  createdAt: string;
}

// Le password NON hanno valore di default: vanno impostate via variabili d'ambiente
// (.env.local in locale, Environment Variables su Vercel). Senza password l'account
// predefinito corrispondente è disabilitato (vedi hasFixedPassword in authContext).
export const FIXED_CREDENTIALS = {
  admin: {
    username: process.env.NEXT_PUBLIC_ADMIN_USER || 'admin',
    email: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@fantasmart.it',
    password: process.env.NEXT_PUBLIC_ADMIN_PASS || '',
    name: 'Super Admin',
    role: 'ADMIN' as UserRole,
  },
  utente: {
    username: process.env.NEXT_PUBLIC_USER_NAME || 'utente',
    email: process.env.NEXT_PUBLIC_USER_EMAIL || 'utente@fantasmart.it',
    password: process.env.NEXT_PUBLIC_USER_PASS || '',
    name: 'Fantallenatore',
    role: 'USER' as UserRole,
  },
};

export const SEED_ACCOUNTS: UserAccount[] = [
  {
    id: 'user-admin-01',
    email: FIXED_CREDENTIALS.admin.email,
    name: FIXED_CREDENTIALS.admin.name,
    role: 'ADMIN',
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'user-utente-02',
    email: FIXED_CREDENTIALS.utente.email,
    name: FIXED_CREDENTIALS.utente.name,
    role: 'USER',
    createdAt: '2026-08-01T00:00:00.000Z',
  },
];
