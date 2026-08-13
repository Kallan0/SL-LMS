/**
 * AppLayout Component
 * 
 * Wraps authenticated pages with navigation and common layout elements.
 */

import { ReactNode } from "react";
import { Navigation } from "./Navigation";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import { useLocation } from "wouter";

export interface AppLayoutProps {
  children: ReactNode;
}

/**
 * AppLayout Component
 */
export function AppLayout({ children }: AppLayoutProps) {
  const [, setLocation] = useLocation();

  // Setup inactivity logout
  useInactivityLogout({
    onLogout: () => {
      setLocation("/login");
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Navigation />
      <main>{children}</main>
    </div>
  );
}
