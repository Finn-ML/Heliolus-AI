import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

// Re-export types from AuthContext for backward compatibility
export type { User, UserRole, AuthState } from '@/contexts/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
