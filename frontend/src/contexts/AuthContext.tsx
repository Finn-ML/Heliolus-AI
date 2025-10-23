import { createContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'ADMIN' | 'USER' | 'VENDOR';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
  hasSeenOnboarding?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextValue extends AuthState {
  login: (token: string, user: User) => void;
  logout: () => void;
  refetchUser: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  isAdmin: () => boolean;
  isUser: () => boolean;
  isVendor: () => boolean;
  getUserInitials: () => string;
  getUserFullName: () => string;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const validateTokenWithBackend = async (token: string): Promise<User | null> => {
      try {
        const response = await fetch('/v1/auth/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          // Backend returns user object directly, not wrapped
          return result;
        } else {
          // Token is invalid or expired
          return null;
        }
      } catch (error) {
        console.error('Token validation failed:', error);
        return null;
      }
    };

    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (token && userStr) {
          // Validate token with backend
          const validUser = await validateTokenWithBackend(token);

          if (validUser) {
            // Token is valid, update user data from backend
            setAuthState({
              user: validUser,
              token,
              isAuthenticated: true,
              isLoading: false,
            });

            // Update localStorage with fresh user data
            localStorage.setItem('user', JSON.stringify(validUser));
          } else {
            // Token is invalid or expired, clear auth state
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setAuthState({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } else {
          setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    initAuth();

    // Listen for storage changes (e.g., login/logout in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'user') {
        initAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = (token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setAuthState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const refetchUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/v1/auth/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const validUser = await response.json();
        setAuthState((prev) => ({
          ...prev,
          user: validUser,
        }));
        localStorage.setItem('user', JSON.stringify(validUser));
      }
    } catch (error) {
      console.error('Failed to refetch user:', error);
    }
  };

  const hasRole = (role: UserRole): boolean => {
    return authState.user?.role === role;
  };

  const isAdmin = (): boolean => {
    return hasRole('ADMIN');
  };

  const isUser = (): boolean => {
    return hasRole('USER');
  };

  const isVendor = (): boolean => {
    return hasRole('VENDOR');
  };

  const getUserInitials = (): string => {
    if (!authState.user) return 'U';
    const firstInitial = authState.user.firstName?.[0] || '';
    const lastInitial = authState.user.lastName?.[0] || '';
    return (firstInitial + lastInitial).toUpperCase() || 'U';
  };

  const getUserFullName = (): string => {
    if (!authState.user) return '';
    return `${authState.user.firstName} ${authState.user.lastName}`.trim();
  };

  const value: AuthContextValue = {
    ...authState,
    login,
    logout,
    refetchUser,
    hasRole,
    isAdmin,
    isUser,
    isVendor,
    getUserInitials,
    getUserFullName,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
