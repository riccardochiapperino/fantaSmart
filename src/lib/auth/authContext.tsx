'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserAccount, UserRole, FIXED_CREDENTIALS } from './mockAccounts';

interface AuthContextType {
  user: UserAccount | null;
  isLoading: boolean;
  isGuest: boolean;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginAsGuest: () => void;
  register: (name: string, email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setActiveAuctionId: (auctionId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'fanta_auth_user';
const USERS_STORAGE_KEY = 'fanta_registered_users';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Caricamento sessione al mount (se non era ospite)
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      if (savedUser) {
        const parsed: UserAccount = JSON.parse(savedUser);
        if (!parsed.isGuest) {
          setUser(parsed);
        }
      }
    } catch (err) {
      console.warn('Errore lettura sessione auth:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSession = useCallback((account: UserAccount | null) => {
    setUser(account);
    if (account) {
      if (!account.isGuest) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(account));
        localStorage.setItem('fanta_user_session', JSON.stringify({
          email: account.email,
          name: account.name,
          role: account.role,
          loggedInAt: Date.now(),
        }));
      } else {
        // Sessione Ospite: pulisce storage per garantire non-persistenza
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem('fanta_user_session');
      }
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem('fanta_user_session');
    }
  }, []);

  // Login con credenziali fisse o account registrati
  const login = async (identifier: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    const rawId = identifier.trim().toLowerCase();
    const rawPwd = (password || '').trim();

    // 1. Verifica Credenziali ADMIN (da variabili d'ambiente; disabilitato se la password non è impostata)
    if (
      FIXED_CREDENTIALS.admin.password !== '' &&
      (rawId === FIXED_CREDENTIALS.admin.username || rawId === FIXED_CREDENTIALS.admin.email.toLowerCase()) &&
      rawPwd === FIXED_CREDENTIALS.admin.password
    ) {
      const adminAccount: UserAccount = {
        id: 'user-admin-01',
        email: FIXED_CREDENTIALS.admin.email,
        name: FIXED_CREDENTIALS.admin.name,
        role: 'ADMIN',
        isGuest: false,
        createdAt: '2026-08-01T00:00:00.000Z',
      };
      saveSession(adminAccount);
      return { success: true };
    }

    // 2. Verifica Credenziali UTENTE (da variabili d'ambiente; disabilitato se la password non è impostata)
    if (
      FIXED_CREDENTIALS.utente.password !== '' &&
      (rawId === FIXED_CREDENTIALS.utente.username || rawId === FIXED_CREDENTIALS.utente.email.toLowerCase()) &&
      rawPwd === FIXED_CREDENTIALS.utente.password
    ) {
      const userAccount: UserAccount = {
        id: 'user-utente-02',
        email: FIXED_CREDENTIALS.utente.email,
        name: FIXED_CREDENTIALS.utente.name,
        role: 'USER',
        isGuest: false,
        createdAt: '2026-08-01T00:00:00.000Z',
      };
      saveSession(userAccount);
      return { success: true };
    }

    // 3. Controllo utenti registrati localmente
    try {
      const rawUsers = localStorage.getItem(USERS_STORAGE_KEY);
      const registered: Array<UserAccount & { password?: string }> = rawUsers ? JSON.parse(rawUsers) : [];
      const found = registered.find(
        u => (u.email.toLowerCase() === rawId || u.name.toLowerCase() === rawId) && (!u.password || u.password === rawPwd)
      );

      if (found) {
        const { password: _, ...cleanAccount } = found;
        saveSession(cleanAccount);
        return { success: true };
      }
    } catch {
      // Ignore
    }

    return {
      success: false,
      error: 'Credenziali non valide.',
    };
  };

  // Login come Ospite (Guest in-memory, sola lettura)
  const loginAsGuest = useCallback(() => {
    const guestAccount: UserAccount = {
      id: `guest-${Date.now()}`,
      email: 'ospite@fantasmart.it',
      name: 'Ospite (Demo)',
      role: 'USER',
      isGuest: true,
      createdAt: new Date().toISOString(),
    };
    saveSession(guestAccount);
  }, [saveSession]);

  // Registrazione nuovo utente
  const register = async (
    name: string,
    email: string,
    password?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!trimmedEmail || !trimmedName) {
      return { success: false, error: 'Nome ed email sono obbligatori.' };
    }

    if (!password || !password.trim()) {
      return { success: false, error: 'La password è obbligatoria.' };
    }

    const newAccount: UserAccount & { password?: string } = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: trimmedEmail,
      name: trimmedName,
      role: 'USER',
      isGuest: false,
      password,
      createdAt: new Date().toISOString(),
    };

    try {
      const rawUsers = localStorage.getItem(USERS_STORAGE_KEY);
      const registered: UserAccount[] = rawUsers ? JSON.parse(rawUsers) : [];

      if (registered.some(u => u.email === trimmedEmail)) {
        return { success: false, error: 'Un account con questa email esiste già.' };
      }

      registered.push(newAccount);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(registered));
    } catch {
      // Ignore
    }

    const { password: _, ...cleanAccount } = newAccount;
    saveSession(cleanAccount);
    return { success: true };
  };

  // Logout
  const logout = useCallback(() => {
    saveSession(null);
  }, [saveSession]);

  // Aggiorna l'asta attiva nel profilo utente
  const setActiveAuctionId = useCallback((auctionId: string) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, activeAuctionId: auctionId };
      if (!prev.isGuest) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isGuest: !!user?.isGuest,
        login,
        loginAsGuest,
        register,
        logout,
        setActiveAuctionId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve essere utilizzato all\'interno di AuthProvider');
  }
  return context;
}
