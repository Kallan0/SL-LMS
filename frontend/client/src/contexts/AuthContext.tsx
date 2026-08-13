/**
 * AuthContext
 * 
 * Provides global authentication state and methods to all components.
 * Wraps the useAuth hook to make it available throughout the application.
 */

import { createContext, useContext, ReactNode } from "react";
import { useAuth, UseAuthReturn } from "@/hooks/useAuth";

/**
 * Auth context type
 */
type AuthContextType = UseAuthReturn | undefined;

const AuthContext = createContext<AuthContextType>(undefined);

/**
 * AuthProvider component
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use auth context
 */
export function useAuthContext(): UseAuthReturn {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  
  return context;
}
