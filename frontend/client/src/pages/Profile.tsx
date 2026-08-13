/**
 * Profile Page
 * 
 * Displays and allows editing of user profile information and preferences.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Settings, Bell, Shield, LogOut } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuthContext } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { ErrorBanner } from "../components/ErrorBanner";

/**
 * Profile Page Component
 */
export default function Profile() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuthContext();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    bio: user?.bio || "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      setError(null);
      // In a real app, this would call an API to update the profile
      console.log("Saving profile:", formData);
      setIsEditing(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save profile";
      setError(errorMessage);
      console.error("Profile save error:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setLocation("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="bg-slate-800/50 dark:bg-slate-900/50 border-b border-slate-700 dark:border-slate-800 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <User className="w-8 h-8 text-indigo-400" />
              <h1 className="text-3xl font-bold text-white">Profile</h1>
            </div>
            <p className="text-slate-400">Manage your account settings and preferences</p>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Error Banner - Hidden for now */}
        {false && error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <ErrorBanner
              message={error || "An error occurred"}
              title="Error"
              severity="error"
              onDismiss={() => setError(null)}
              autoDismissMs={0}
            />
          </motion.div>
        )}

        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 dark:bg-slate-900 rounded-lg border border-slate-700 dark:border-slate-800 p-8 mb-6"
        >
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Personal Information</h2>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant="outline"
              className="text-slate-300 border-slate-600 hover:bg-slate-700"
            >
              {isEditing ? "Cancel" : "Edit"}
            </Button>
          </div>

          <div className="flex items-center gap-6 mb-8">
            <img
              src={user?.avatar}
              alt={user?.firstName}
              className="w-20 h-20 rounded-full border-2 border-indigo-500"
            />
            <div>
              <p className="text-slate-400 text-sm mb-1">Email</p>
              <p className="text-white font-medium">{user?.email}</p>
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-slate-300 mb-2 block">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="bg-slate-700 dark:bg-slate-800 border-slate-600 dark:border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-slate-300 mb-2 block">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="bg-slate-700 dark:bg-slate-800 border-slate-600 dark:border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio" className="text-slate-300 mb-2 block">
                  Bio
                </Label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-700 dark:bg-slate-800 border border-slate-600 dark:border-slate-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <Button
                onClick={handleSaveProfile}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Save Changes
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm mb-1">First Name</p>
                  <p className="text-white font-medium">{formData.firstName}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Last Name</p>
                  <p className="text-white font-medium">{formData.lastName}</p>
                </div>
              </div>

              {formData.bio && (
                <div>
                  <p className="text-slate-400 text-sm mb-1">Bio</p>
                  <p className="text-white">{formData.bio}</p>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Preferences Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800 dark:bg-slate-900 rounded-lg border border-slate-700 dark:border-slate-800 p-8 mb-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-6 h-6 text-indigo-400" />
            <h2 className="text-2xl font-bold text-white">Preferences</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-indigo-400" />
                <div>
                  <p className="text-white font-medium">Notifications</p>
                  <p className="text-slate-400 text-sm">Receive lesson reminders and updates</p>
                </div>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-indigo-400" />
                <div>
                  <p className="text-white font-medium">Captions</p>
                  <p className="text-slate-400 text-sm">Show captions in lesson videos</p>
                </div>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800 dark:bg-slate-900 rounded-lg border border-red-700/50 dark:border-red-800/50 p-8"
        >
          <h2 className="text-2xl font-bold text-red-400 mb-6">Danger Zone</h2>

          <Button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </motion.div>
      </main>
    </div>
  );
}
