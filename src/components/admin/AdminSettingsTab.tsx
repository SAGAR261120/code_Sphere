"use client";

import React, { useState, useEffect } from "react";
import {
  SlidersHorizontal,
  ShieldCheck,
  ShieldAlert,
  Coins,
  FileText,
  Bell,
  RefreshCw,
  CheckCircle2,
  Lock,
  Layers,
  Plus,
  Search,
  Filter,
  Eye,
  Info,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface AdminSettingsTabProps {
  addToast: (title: string, message: string, type: "success" | "error" | "info" | "warning") => void;
}

export function AdminSettingsTab({ addToast }: AdminSettingsTabProps) {
  const [subTab, setSubTab] = useState<"SETTINGS" | "CATEGORIES" | "AUDIT">("SETTINGS");

  // Settings State
  const [activeCategory, setActiveCategory] = useState<"GENERAL" | "FINANCIAL" | "SECURITY" | "NOTIFICATIONS" | "LEGAL">("GENERAL");
  const [settingsGrouped, setSettingsGrouped] = useState<Record<string, any[]>>({
    GENERAL: [],
    FINANCIAL: [],
    SECURITY: [],
    NOTIFICATIONS: [],
    LEGAL: [],
  });
  const [editableValues, setEditableValues] = useState<Record<string, string>>({});
  const [settingsReason, setSettingsReason] = useState("");
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Categories State
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", slug: "", description: "", icon: "Code" });
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [auditFilterAction, setAuditFilterAction] = useState("");
  const [auditFilterTarget, setAuditFilterTarget] = useState("");
  const [auditPage, setAuditPage] = useState(1);
  const [auditPagination, setAuditPagination] = useState<any>(null);

  useEffect(() => {
    fetchSettings();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (subTab === "AUDIT") {
      fetchAuditLogs(1);
    }
  }, [subTab, auditFilterAction, auditFilterTarget]);

  const fetchSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const res = await fetch("/api/v1/admin/settings");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to load platform settings");

      if (json.data?.grouped) {
        setSettingsGrouped(json.data.grouped);
        const map: Record<string, string> = {};
        json.data.all?.forEach((item: any) => {
          map[item.key] = item.value;
        });
        setEditableValues(map);
      }
    } catch (err: any) {
      addToast("Settings Error", err.message, "error");
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const res = await fetch("/api/v1/categories");
      const json = await res.json();
      if (res.ok && json.data) {
        setCategories(json.data);
      }
    } catch {
      // fallback
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const fetchAuditLogs = async (pageNum = 1) => {
    setIsLoadingAudit(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(pageNum));
      params.set("limit", "20");
      if (auditFilterAction) params.set("action", auditFilterAction);
      if (auditFilterTarget) params.set("targetType", auditFilterTarget);

      const res = await fetch(`/api/v1/admin/audit?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setAuditLogs(json.data || []);
        setAuditPagination(json.pagination);
        setAuditPage(pageNum);
      }
    } catch {
      // fallback
    } finally {
      setIsLoadingAudit(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settingsReason.trim().length < 5) {
      addToast("Reason Required", "Please provide a reason with at least 5 characters for compliance.", "warning");
      return;
    }

    const currentItems = settingsGrouped[activeCategory] || [];
    const payload = currentItems.map((item) => ({
      key: item.key,
      value: editableValues[item.key] ?? item.value,
      description: item.description,
      category: activeCategory,
      isPublic: item.isPublic,
    }));

    setIsSavingSettings(true);
    try {
      const res = await fetch("/api/v1/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: payload,
          reason: settingsReason.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to update platform settings");

      addToast("Settings Saved", "Platform policies updated and audit record logged.", "success");
      setSettingsReason("");
      fetchSettings();
    } catch (err: any) {
      addToast("Update Failed", err.message, "error");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;

    setIsCreatingCategory(true);
    try {
      const slug =
        newCategory.slug.trim() ||
        newCategory.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");

      const res = await fetch("/api/v1/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategory.name.trim(),
          slug,
          description: newCategory.description.trim() || undefined,
          icon: newCategory.icon || "Code",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to create category");

      addToast("Category Created", `${newCategory.name} is now available for products.`, "success");
      setNewCategory({ name: "", slug: "", description: "", icon: "Code" });
      fetchCategories();
    } catch (err: any) {
      addToast("Category Error", err.message, "error");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Section Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-sky-500" />
            <span>Platform Governance, Policies & Audit Logs</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage global marketplace settings, taxonomy categories, and inspect system audit trails.
          </p>
        </div>

        {/* Sub-Tabs Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setSubTab("SETTINGS")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              subTab === "SETTINGS"
                ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            System Policies
          </button>
          <button
            onClick={() => setSubTab("CATEGORIES")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              subTab === "CATEGORIES"
                ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            Catalog Categories
          </button>
          <button
            onClick={() => setSubTab("AUDIT")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              subTab === "AUDIT"
                ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            Audit Trail
          </button>
        </div>
      </div>

      {/* 2. Sub-Tab 1: Platform Settings by Category */}
      {subTab === "SETTINGS" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Category Selector Sidebar */}
          <div className="lg:col-span-1 space-y-1 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1 block">
              Policy Categories
            </span>
            <button
              onClick={() => setActiveCategory("GENERAL")}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
                activeCategory === "GENERAL"
                  ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <FileText className="w-4 h-4 text-sky-500" />
              <span>General & Branding</span>
            </button>
            <button
              onClick={() => setActiveCategory("FINANCIAL")}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
                activeCategory === "FINANCIAL"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <Coins className="w-4 h-4 text-amber-500" />
              <span>Coins & Financial</span>
            </button>
            <button
              onClick={() => setActiveCategory("SECURITY")}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
                activeCategory === "SECURITY"
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>Security & Lockout</span>
            </button>
            <button
              onClick={() => setActiveCategory("NOTIFICATIONS")}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
                activeCategory === "NOTIFICATIONS"
                  ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <Bell className="w-4 h-4 text-indigo-500" />
              <span>Notifications & Alerts</span>
            </button>
            <button
              onClick={() => setActiveCategory("LEGAL")}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
                activeCategory === "LEGAL"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Legal & Compliance</span>
            </button>
          </div>

          {/* Settings Editor Form */}
          <div className="lg:col-span-3">
            <form
              onSubmit={handleSaveSettings}
              className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6 shadow-sm"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {activeCategory} Configuration Parameters
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Modifying system parameters requires a mandatory justification recorded in the immutable audit log.
                  </p>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  {settingsGrouped[activeCategory]?.length || 0} Parameters
                </span>
              </div>

              {isLoadingSettings ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-500 mb-2" />
                  Loading parameters...
                </div>
              ) : (
                <div className="space-y-4">
                  {settingsGrouped[activeCategory]?.map((param: any) => (
                    <div
                      key={param.key}
                      className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <label className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {param.key}
                        </label>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            param.isPublic
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                          }`}
                        >
                          {param.isPublic ? "Public Config" : "Internal Restricted"}
                        </span>
                      </div>

                      <input
                        type="text"
                        value={editableValues[param.key] ?? param.value}
                        onChange={(e) =>
                          setEditableValues((prev) => ({
                            ...prev,
                            [param.key]: e.target.value,
                          }))
                        }
                        className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs focus:ring-2 focus:ring-sky-500"
                      />

                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Info className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{param.description}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Mandatory Reason Prompt */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Mandatory Audit Log Justification / Reason:
                </label>
                <textarea
                  value={settingsReason}
                  onChange={(e) => setSettingsReason(e.target.value)}
                  placeholder="Detail the operational rationale for modifying these platform parameters..."
                  rows={2}
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={isSavingSettings || settingsReason.trim().length < 5}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSavingSettings ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Save {activeCategory} Settings</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Sub-Tab 2: Catalog Categories Management */}
      {subTab === "CATEGORIES" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Category Form */}
          <form
            onSubmit={handleCreateCategory}
            className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm h-fit"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-sky-500" />
              <span>Create Product Category</span>
            </h3>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Name</label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="e.g. Next.js SaaS, AI Agents, Mobile Flutter"
                required
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Slug (Optional)</label>
              <input
                type="text"
                value={newCategory.slug}
                onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                placeholder="Leave blank to generate automatically"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Description</label>
              <textarea
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Category discovery description..."
                rows={2}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={isCreatingCategory || !newCategory.name.trim()}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white transition-colors disabled:opacity-50"
            >
              {isCreatingCategory ? "Creating..." : "Add Category to Catalog"}
            </button>
          </form>

          {/* Existing Categories Table */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Active Product Categories ({categories.length})
              </h3>
              <button
                onClick={fetchCategories}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {categories.map((cat) => (
                <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">
                      {cat.name}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 block">/{cat.slug}</span>
                    {cat.description && (
                      <p className="text-[11px] text-slate-500 mt-1">{cat.description}</p>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Sub-Tab 3: Full System Audit Log Viewer */}
      {subTab === "AUDIT" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full flex items-center gap-2">
              <input
                type="text"
                value={auditFilterAction}
                onChange={(e) => setAuditFilterAction(e.target.value)}
                placeholder="Filter by action (e.g. USER_STATUS_UPDATE, ORDER_REFUND, REVIEW_APPROVED)..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-sky-500"
              />
              <button
                onClick={() => fetchAuditLogs(1)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white shrink-0"
              >
                Filter
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoadingAudit ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-500 mb-2" />
                      Loading audit logs...
                    </td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No audit logs match current filters.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-sky-600 dark:text-sky-400 text-[11px]">
                        {log.action}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block text-[11px]">
                          {log.admin?.email || "Super Administrator"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                          {log.targetType} ({log.targetId.slice(0, 8)}...)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                        {log.reason || "Administrative state transition"}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[10px]">
                        {formatDate(log.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {auditPagination && auditPagination.totalPages > 1 && (
              <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between text-xs text-slate-500">
                <span>Page {auditPagination.page} of {auditPagination.totalPages}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchAuditLogs(auditPage - 1)}
                    disabled={auditPage <= 1}
                    className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchAuditLogs(auditPage + 1)}
                    disabled={auditPage >= auditPagination.totalPages}
                    className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
