"use client";

import React, { useState, useEffect } from "react";
import { useMarketplace } from "@/context/marketplace-context";
import { CoinBadge } from "@/components/ui/CoinBadge";
import { formatCoins, formatDate } from "@/lib/utils";
import {
  User,
  Shield,
  Coins,
  Key,
  Lock,
  LogOut,
  Laptop,
  Smartphone,
  Globe,
  Code2,
  Share2,
  Trash2,
  History,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Save,
} from "lucide-react";

export default function ProfilePage() {
  const { user, role, coinBalance, addToast } = useMarketplace();

  const [activeTab, setActiveTab] = useState<"PROFILE" | "SECURITY" | "SESSIONS" | "ACTIVITY" | "PRIVACY">("PROFILE");

  // Profile Form State
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [website, setWebsite] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [revokeOthers, setRevokeOthers] = useState(true);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Sessions State
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // Activity State
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  // Deletion State
  const [deletionConfirm, setDeletionConfirm] = useState("");
  const [deletionReason, setDeletionReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Load initial profile data
  useEffect(() => {
    fetchProfile();
    fetchSessions();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/v1/user/profile");
      if (res.ok) {
        const json = await res.json();
        const p = json.data?.profile;
        if (p) {
          setDisplayName(p.displayName || "");
          setBio(p.bio || "");
          setAvatarUrl(p.avatarUrl || "");
          setWebsite(p.website || "");
          setGithubUrl(p.githubUrl || "");
          setTwitterUrl(p.twitterUrl || "");
        }
      }
    } catch {
      // Fallback to context
      if (user) {
        setDisplayName(user.name);
      }
    }
  };

  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const res = await fetch("/api/v1/auth/sessions");
      if (res.ok) {
        const json = await res.json();
        setSessions(json.data || []);
      }
    } catch {
      // Mock fallback
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const fetchActivity = async () => {
    setIsLoadingActivity(true);
    try {
      const res = await fetch("/api/v1/user/activity");
      if (res.ok) {
        const json = await res.json();
        setActivities(json.data || []);
      }
    } catch {
      // Mock fallback
    } finally {
      setIsLoadingActivity(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/v1/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, bio, avatarUrl, website, githubUrl, twitterUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to update profile");
      addToast("Profile Updated", "Your developer credentials have been saved.", "success");
    } catch (err: any) {
      addToast("Update Failed", err.message, "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast("Mismatch", "New password confirmation does not match.", "error");
      return;
    }
    setIsSavingPassword(true);
    try {
      const res = await fetch("/api/v1/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
          revokeOtherSessions: revokeOthers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to change password");
      addToast("Password Changed", "Your password was updated. Other sessions revoked.", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      fetchSessions();
    } catch (err: any) {
      addToast("Change Failed", err.message, "error");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleRevokeSession = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/auth/sessions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revoke session");
      addToast("Session Revoked", "The device session was terminated.", "info");
      fetchSessions();
    } catch (err: any) {
      addToast("Revocation Failed", err.message, "error");
    }
  };

  const handleRevokeAllOthers = async () => {
    try {
      const res = await fetch("/api/v1/auth/sessions", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to terminate other sessions");
      addToast("Sessions Cleared", "All other active sessions have been logged out.", "success");
      fetchSessions();
    } catch (err: any) {
      addToast("Failed", err.message, "error");
    }
  };

  const handleRequestDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deletionConfirm !== "DELETE_MY_ACCOUNT") {
      addToast("Confirmation Required", "Type DELETE_MY_ACCOUNT to confirm.", "error");
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch("/api/v1/user/delete-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: deletionConfirm, reason: deletionReason }),
      });
      if (!res.ok) throw new Error("Deletion request failed");
      addToast("Account Suspended", "Deletion initiated. Logging out...", "warning");
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err: any) {
      addToast("Error", err.message, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl pb-12">
      {/* 1. Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Account & Developer Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your identity credentials, active sessions, and security preferences.
        </p>
      </div>

      {/* 2. Top Summary Card */}
      <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold uppercase shadow-md overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              displayName?.charAt(0) || user?.name?.charAt(0) || "U"
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                {displayName || user?.name || "Developer Account"}
              </h2>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold">
                {role}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400">{user?.email || "developer@example.com"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CoinBadge amount={coinBalance} size="lg" />
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("PROFILE")}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap ${
            activeTab === "PROFILE"
              ? "border-b-2 border-sky-500 text-sky-600 dark:text-sky-400 font-bold"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Profile & Bio
        </button>
        <button
          onClick={() => setActiveTab("SECURITY")}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap ${
            activeTab === "SECURITY"
              ? "border-b-2 border-sky-500 text-sky-600 dark:text-sky-400 font-bold"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Password & Security
        </button>
        <button
          onClick={() => {
            setActiveTab("SESSIONS");
            fetchSessions();
          }}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap ${
            activeTab === "SESSIONS"
              ? "border-b-2 border-sky-500 text-sky-600 dark:text-sky-400 font-bold"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Active Sessions ({sessions.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("ACTIVITY");
            fetchActivity();
          }}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap ${
            activeTab === "ACTIVITY"
              ? "border-b-2 border-sky-500 text-sky-600 dark:text-sky-400 font-bold"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Activity Timeline
        </button>
        <button
          onClick={() => setActiveTab("PRIVACY")}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap ${
            activeTab === "PRIVACY"
              ? "border-b-2 border-rose-500 text-rose-600 dark:text-rose-400 font-bold"
              : "text-slate-500 hover:text-rose-600"
          }`}
        >
          Privacy & Termination
        </button>
      </div>

      {/* 4. Tab Contents */}

      {/* 4.1 Profile Tab */}
      {activeTab === "PROFILE" && (
        <form onSubmit={handleSaveProfile} className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <User className="w-5 h-5 text-sky-500" />
            <span>Developer Profile</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Display Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Avatar URL</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the marketplace about your specialties..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-sky-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Website
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourdomain.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5" /> GitHub
              </label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" /> X / Twitter
              </label>
              <input
                type="url"
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                placeholder="https://x.com/..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold text-xs shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingProfile ? "Saving..." : "Save Profile"}</span>
            </button>
          </div>
        </form>
      )}

      {/* 4.2 Security & Password Tab */}
      {activeTab === "SECURITY" && (
        <form onSubmit={handleChangePassword} className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-500" />
            <span>Change Master Password</span>
          </h3>

          <div className="space-y-3 max-w-md">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 chars, 1 uppercase, 1 digit"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={revokeOthers}
                onChange={(e) => setRevokeOthers(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Revoke and sign out of all other device sessions</span>
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSavingPassword}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-xs shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              <Key className="w-4 h-4" />
              <span>{isSavingPassword ? "Updating..." : "Update Password"}</span>
            </button>
          </div>
        </form>
      )}

      {/* 4.3 Active Sessions Tab */}
      {activeTab === "SESSIONS" && (
        <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Laptop className="w-5 h-5 text-sky-500" />
                <span>Active Device Sessions</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Revoke unrecognized devices to safeguard your wallet and digital licenses.
              </p>
            </div>
            <button
              onClick={handleRevokeAllOthers}
              className="px-3.5 py-1.5 rounded-xl border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-colors"
            >
              Revoke All Others
            </button>
          </div>

          <div className="space-y-3">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {sess.userAgent.slice(0, 45)}...
                      </span>
                      {sess.isCurrent && (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          Current Device
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      IP: {sess.ipAddress} • Signed in: {formatDate(sess.createdAt)}
                    </p>
                  </div>
                </div>

                {!sess.isCurrent && (
                  <button
                    onClick={() => handleRevokeSession(sess.id)}
                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Revoke session"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4.4 Activity Timeline Tab */}
      {activeTab === "ACTIVITY" && (
        <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-500" />
              <span>Audit & Activity Timeline</span>
            </h3>
            <button
              onClick={fetchActivity}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingActivity ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="space-y-3">
            {activities.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No recent account activities recorded yet.
              </div>
            ) : (
              activities.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{act.title}</div>
                    <div className="text-[11px] text-slate-400">{formatDate(act.timestamp)}</div>
                  </div>
                  {act.amount !== undefined && (
                    <span
                      className={`font-mono font-bold ${
                        act.amount > 0 ? "text-emerald-500" : "text-slate-500"
                      }`}
                    >
                      {act.amount > 0 ? `+${act.amount}` : act.amount} Coins
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4.5 Privacy & Deletion Tab */}
      {activeTab === "PRIVACY" && (
        <form onSubmit={handleRequestDeletion} className="p-6 sm:p-8 rounded-3xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/10 space-y-5">
          <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-base font-bold">Terminate Account & Data Request</h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Submitting an account deletion will suspend your account, terminate all active sessions, and freeze remaining coin credits. Transaction records are preserved in audit logs per financial compliance regulations.
          </p>

          <div className="space-y-3 max-w-md">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Type <span className="font-mono text-rose-600">DELETE_MY_ACCOUNT</span> to confirm
              </label>
              <input
                type="text"
                required
                value={deletionConfirm}
                onChange={(e) => setDeletionConfirm(e.target.value)}
                placeholder="DELETE_MY_ACCOUNT"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-mono focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Reason (Optional)</label>
              <input
                type="text"
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                placeholder="Reason for leaving..."
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isDeleting || deletionConfirm !== "DELETE_MY_ACCOUNT"}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md disabled:opacity-40 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? "Processing..." : "Terminate Account"}</span>
          </button>
        </form>
      )}
    </div>
  );
}
