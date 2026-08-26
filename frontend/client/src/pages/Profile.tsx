/**
 * Profile Page
 *
 * Displays and allows editing of user profile information with stats summary,
 * avatar management, and password change functionality.
 */

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { User, Shield, LogOut, Camera, Upload, X, Zap, Flame, BookOpen, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuthContext } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useQuery } from "@/hooks/useQuery";
import { apiService } from "@/services/api";
import { ErrorBanner } from "../components/ErrorBanner";
import { LogoutConfirmModal } from "@/components/LogoutConfirmModal";
import { PageHeader } from "@/components/PageHeader";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { user, logout, updateUser } = useAuthContext();

  // Stats
  const { data: progress } = useQuery("progress", () => apiService.getProgress(), { staleTime: 5 * 60 * 1000 });
  const { data: achievements } = useQuery("achievements", () => apiService.getAchievements(), { staleTime: 10 * 60 * 1000 });
  const completedLessons = (progress || []).filter((p) => p.status === "COMPLETED").length;
  const unlockedAchievements = (achievements || []).filter((a) => a.unlockedAt).length;

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, newPw: false });
  const [pwSaving, setPwSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    bio: user?.bio || "",
  });
  const [error, setError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      setError(null);
      setSaving(true);
      await updateUser({
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        bio: formData.bio || undefined,
      });
      setIsEditing(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save profile";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const avatarLetter = (user?.firstName || user?.username || user?.email || "?")[0].toUpperCase();

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select an image file"); return; }
    if (file.size > 2 * 1024 * 1024) { setError("Image must be smaller than 2MB"); return; }
    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => { setAvatarPreview(event.target?.result as string); setAvatarUploading(false); };
    reader.onerror = () => { setError("Failed to read image file"); setAvatarUploading(false); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSaveAvatar = async () => {
    if (!avatarPreview) return;
    try { setSaving(true); setError(null); await updateUser({ avatar: avatarPreview }); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to save avatar"); }
    finally { setSaving(false); }
  };

  const handleRemoveAvatar = async () => {
    try { setSaving(true); setError(null); setAvatarPreview(null); await updateUser({ avatar: undefined }); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to remove avatar"); }
    finally { setSaving(false); }
  };

  const hasAvatarChanged = avatarPreview !== (user?.avatar || null);

  const handleChangePassword = async () => {
    if (!pwForm.current || !pwForm.newPw) { setError("Please fill in all password fields"); return; }
    if (pwForm.newPw !== pwForm.confirm) { setError("New passwords do not match"); return; }
    if (pwForm.newPw.length < 6) { setError("New password must be at least 6 characters"); return; }
    try {
      setPwSaving(true); setError(null);
      // In mock mode this is a no-op; in production would call API
      await new Promise((r) => setTimeout(r, 500));
      setShowPasswordChange(false);
      setPwForm({ current: "", newPw: "", confirm: "" });
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to change password"); }
    finally { setPwSaving(false); }
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    try { await logout(); setLocation("/login"); } catch { /* ignore */ }
  };

  const inputClass = "bg-slate-700 dark:bg-slate-800 border-slate-600 dark:border-slate-700 text-white";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <PageHeader
        icon={<User className="w-8 h-8" />}
        title="Profile"
        subtitle="Manage your account settings and preferences"
        accentColor="text-indigo-400"
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {error && (
          <ErrorBanner message={error} title="Error" severity="error" onDismiss={() => setError(null)} autoDismissMs={0} />
        )}

        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 rounded-xl border border-slate-700/50 p-6"
        >
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            <div className="relative group shrink-0">
              <button onClick={handleAvatarClick}
                className="w-20 h-20 rounded-full border-2 border-indigo-500 overflow-hidden flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                disabled={avatarUploading}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-3xl font-bold">{avatarLetter}</span>
                  </div>
                )}
              </button>
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={handleAvatarClick}>
                {avatarUploading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Camera className="w-6 h-6 text-white" />}
              </div>
            </div>

            <div className="flex-1">
              <p className="text-white font-bold text-lg">{user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username}</p>
              <p className="text-slate-400 text-sm">@{user?.username} · {user?.email}</p>
              <div className="flex items-center gap-3 mt-3">
                <Button onClick={handleAvatarClick} variant="outline" size="sm" className="text-slate-300 border-slate-600 hover:bg-slate-700 text-xs">
                  <Upload className="w-3 h-3 mr-1.5" /> Upload Photo
                </Button>
                {avatarPreview && (
                  <Button onClick={handleRemoveAvatar} variant="outline" size="sm" className="text-red-400 border-red-700/50 hover:bg-red-600/20 text-xs">
                    <X className="w-3 h-3 mr-1.5" /> Remove
                  </Button>
                )}
                {hasAvatarChanged && (
                  <Button onClick={handleSaveAvatar} size="sm" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                    {saving ? "Saving…" : "Save Photo"}
                  </Button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="hidden sm:flex items-center gap-5 shrink-0">
              <div className="text-center">
                <div className="flex items-center gap-1 text-orange-400 mb-1"><Flame className="w-3.5 h-3.5" /><span className="text-xs font-bold">{user?.streak ?? 0}</span></div>
                <span className="text-[10px] text-slate-500">Streak</span>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-yellow-400 mb-1"><Zap className="w-3.5 h-3.5" /><span className="text-xs font-bold">{user?.xp ?? 0}</span></div>
                <span className="text-[10px] text-slate-500">XP</span>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-blue-400 mb-1"><BookOpen className="w-3.5 h-3.5" /><span className="text-xs font-bold">{completedLessons}</span></div>
                <span className="text-[10px] text-slate-500">Lessons</span>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-emerald-400 mb-1"><Shield className="w-3.5 h-3.5" /><span className="text-xs font-bold">{unlockedAchievements}</span></div>
                <span className="text-[10px] text-slate-500">Badges</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Personal Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-slate-800 rounded-xl border border-slate-700/50 p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white">Personal Information</h2>
            <Button onClick={() => setIsEditing(!isEditing)} variant="outline" size="sm"
              className="text-slate-300 border-slate-600 hover:bg-slate-700 text-xs">
              {isEditing ? "Cancel" : "Edit"}
            </Button>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-slate-300 mb-1.5 block text-xs">First Name</Label>
                  <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} className={inputClass} />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-slate-300 mb-1.5 block text-xs">Last Name</Label>
                  <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} className={inputClass} />
                </div>
              </div>
              <div>
                <Label htmlFor="bio" className="text-slate-300 mb-1.5 block text-xs">Bio</Label>
                <textarea id="bio" name="bio" value={formData.bio} onChange={handleInputChange} rows={3}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="Tell us about yourself..." />
              </div>
              <Button onClick={handleSaveProfile} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50">
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><p className="text-slate-500 text-xs mb-1">First Name</p><p className="text-white font-medium text-sm">{formData.firstName || "—"}</p></div>
              <div><p className="text-slate-500 text-xs mb-1">Last Name</p><p className="text-white font-medium text-sm">{formData.lastName || "—"}</p></div>
              {formData.bio && <div className="md:col-span-2"><p className="text-slate-500 text-xs mb-1">Bio</p><p className="text-white text-sm">{formData.bio}</p></div>}
            </div>
          )}
        </motion.div>

        {/* Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800 rounded-xl border border-slate-700/50 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Security</h2>
          </div>

          {!showPasswordChange ? (
            <button onClick={() => setShowPasswordChange(true)}
              className="flex items-center gap-3 w-full p-4 bg-slate-700/30 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors text-left">
              <Lock className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-white text-sm font-medium">Change Password</p>
                <p className="text-slate-500 text-xs">Update your account password</p>
              </div>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Label className="text-slate-400 text-xs mb-1 block">Current Password</Label>
                <div className="relative">
                  <Input type={showPw.current ? "text" : "password"} placeholder="••••••••" value={pwForm.current}
                    onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })} className={`${inputClass} pr-10`} />
                  <button onClick={() => setShowPw({ ...showPw, current: !showPw.current })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                    {showPw.current ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div className="relative">
                <Label className="text-slate-400 text-xs mb-1 block">New Password</Label>
                <div className="relative">
                  <Input type={showPw.newPw ? "text" : "password"} placeholder="••••••••" value={pwForm.newPw}
                    onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })} className={`${inputClass} pr-10`} />
                  <button onClick={() => setShowPw({ ...showPw, newPw: !showPw.newPw })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                    {showPw.newPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <Label className="text-slate-400 text-xs mb-1 block">Confirm New Password</Label>
                <Input type="password" placeholder="••••••••" value={pwForm.confirm}
                  onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} className={inputClass} />
              </div>
              <div className="flex gap-2 pt-1">
                <Button onClick={handleChangePassword} disabled={pwSaving} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                  {pwSaving ? "Saving…" : "Update Password"}
                </Button>
                <Button onClick={() => { setShowPasswordChange(false); setPwForm({ current: "", newPw: "", confirm: "" }); }}
                  variant="outline" size="sm" className="text-slate-400 border-slate-700 text-xs">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-slate-800 rounded-xl border border-red-700/30 p-6"
        >
          <h2 className="text-lg font-bold text-red-400 mb-4">Danger Zone</h2>
          <Button onClick={() => setShowLogoutConfirm(true)} className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2">
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </motion.div>
      </main>

      <LogoutConfirmModal open={showLogoutConfirm} onConfirm={confirmLogout} onCancel={() => setShowLogoutConfirm(false)} />
    </div>
  );
}
