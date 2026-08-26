/**
 * Navigation Component
 * 
 * Main navigation bar for authenticated pages.
 * Provides links to main sections and user menu.
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Trophy,
  User,
  LogOut,
  Menu,
  X,
  Zap,
  Home,
  Shield,
  MessageSquare,
} from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { LogoutConfirmModal } from "@/components/LogoutConfirmModal";

/**
 * Navigation Component
 */
export function Navigation() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuthContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const avatarLetter = (user?.firstName || user?.username || user?.email || "?")[0].toUpperCase();

  const isMentor = user?.role === "MENTOR";

  const navItems = [
    { href: "/dashboard", label: isMentor ? "Mentor Hub" : "Dashboard", icon: isMentor ? Shield : Home },
    { href: "/lessons", label: "Lessons", icon: BookOpen },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/profile", label: "Profile", icon: User },
    ...(isMentor ? [
      { href: "/lesson-manager", label: "Manage", icon: BookOpen },
    ] : [
      { href: "/assessment", label: "Assessment", icon: Zap },
    ]),
    { href: "/chat", label: "Messages", icon: MessageSquare },
  ];

  const isActive = (href: string) => location === href;

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    try {
      await logout();
      setLocation("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <>
    <LogoutConfirmModal
      open={showLogoutConfirm}
      onConfirm={confirmLogout}
      onCancel={() => setShowLogoutConfirm(false)}
    />

    <nav className="bg-slate-900/60 dark:bg-slate-950/70 border-b border-slate-700/30 dark:border-slate-800/30 backdrop-blur-2xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setLocation("/dashboard")}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white hidden sm:inline">Sign Language LMS</span>
          </motion.div>

          {/* Navigation — pill container, scrollable on small screens */}
          <div className="hidden sm:flex items-center bg-slate-800/80 dark:bg-slate-900/80 border border-slate-700/60 dark:border-slate-700/40 rounded-full px-1.5 py-1 gap-0.5 shadow-lg shadow-black/20 overflow-x-auto scrollbar-none max-w-[50vw]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <motion.button
                  key={item.href}
                  onClick={() => setLocation(item.href)}
                  className={`flex items-center gap-1.5 px-3 sm:px-2.5 lg:px-3.5 py-1.5 rounded-full text-sm transition-all whitespace-nowrap shrink-0 ${
                    active
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-700/60"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title={item.label}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="font-medium hidden md:inline">{item.label}</span>
                </motion.button>
              );
            })}
          </div>

          {/* User Menu and Mobile Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* User Avatar — always visible, name shown on md+ */}
            <motion.button
              onClick={() => setLocation("/profile")}
              className="flex items-center gap-2 p-1 sm:p-1.5 sm:pr-3 rounded-full hover:bg-slate-700/50 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Profile"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-xs font-bold select-none">{avatarLetter}</span>
                )}
              </div>
              <div className="text-sm text-left hidden lg:block">
                <p className="text-white font-medium leading-tight">{user?.firstName || user?.username}</p>
                <p className="text-slate-400 text-xs leading-tight">{user?.xp ?? 0} XP</p>
              </div>
            </motion.button>

            {/* Logout Button — visible on md+ */}
            <motion.button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-red-600/20 hover:text-red-400 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>

            {/* Mobile Menu Toggle — visible below sm */}
            <motion.button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="sm:hidden p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <Menu className="w-5 h-5 text-white" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="sm:hidden border-t border-slate-700 dark:border-slate-800"
            >
              <div className="px-2 py-4 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <motion.button
                      key={item.href}
                      onClick={() => {
                        setLocation(item.href);
                        setIsMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        active
                          ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                          : "text-slate-300 hover:bg-slate-700/50"
                      }`}
                      whileHover={{ x: 4 }}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{item.label}</span>
                    </motion.button>
                  );
                })}

                <motion.button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-600/20 transition-colors"
                  whileHover={{ x: 4 }}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium">Logout</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
    </>
  );
}
