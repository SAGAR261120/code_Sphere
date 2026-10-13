"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useMarketplace } from "@/context/marketplace-context";
import { CoinBadge } from "@/components/ui/CoinBadge";
import { formatCoins, formatDate } from "@/lib/utils";
import {
  ShieldAlert,
  Users,
  Coins,
  Package,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  Lock,
  Search,
  Filter,
  UserCheck,
  UserX,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  BarChart3,
  Wrench,
  Settings,
  CreditCard,
  IndianRupee,
  FileText,
  Clock,
  ArrowUpRight,
  Shield,
  Zap,
  Link2,
  MessageSquare,
} from "lucide-react";
import { AdminTasksTab } from "@/components/admin/AdminTasksTab";
import { AdminShortlinksTab } from "@/components/admin/AdminShortlinksTab";
import { AdminOverviewTab } from "@/components/admin/AdminOverviewTab";
import { AdminOrdersTab } from "@/components/admin/AdminOrdersTab";
import { AdminReviewsTab } from "@/components/admin/AdminReviewsTab";
import { AdminSettingsTab } from "@/components/admin/AdminSettingsTab";

export default function AdminPage() {
  const { role, switchRole, addToast, addCoins } = useMarketplace();

  const [activeTab, setActiveTab] = useState<
    | "OVERVIEW"
    | "USERS"
    | "PRODUCTS"
    | "ORDERS"
    | "ECONOMY"
    | "DEPOSITS"
    | "TASKS"
    | "SHORTLINKS"
    | "REVIEWS"
    | "SETTINGS"
    | "SUSPICIOUS"
  >("OVERVIEW");

  // Users State
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("ALL");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  // Status Moderation Modal State
  const [moderatingUser, setModeratingUser] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState<"ACTIVE" | "SUSPENDED" | "BANNED">("SUSPENDED");
  const [moderationReason, setModerationReason] = useState("");
  const [isSubmittingModeration, setIsSubmittingModeration] = useState(false);

  // Role Moderation Modal State
  const [roleUser, setRoleUser] = useState<any | null>(null);
  const [newRole, setNewRole] = useState("USER");
  const [roleReason, setRoleReason] = useState("");
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);

  // Suspicious Activity State
  const [suspiciousData, setSuspiciousData] = useState<{ lockedUsers: any[]; fraudAttempts: any[] }>({
    lockedUsers: [],
    fraudAttempts: [],
  });
  const [isLoadingSuspicious, setIsLoadingSuspicious] = useState(false);

  // Product Submissions & Catalog State
  const [adminProducts, setAdminProducts] = useState<any[]>([]);
  const [isLoadingAdminProducts, setIsLoadingAdminProducts] = useState(false);
  const [productStatusFilter, setProductStatusFilter] = useState("ALL");
  const [productSearch, setProductSearch] = useState("");
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [moderatingProduct, setModeratingProduct] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmittingProductStatus, setIsSubmittingProductStatus] = useState(false);
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: "",
    shortDescription: "",
    description: "",
    categoryId: "",
    coinPrice: 0,
    fiatPricePaise: 0,
    isFree: false,
    platforms: ["Web"],
    techStack: "",
    tags: "",
    demoUrl: "",
    version: "1.0.0",
  });

  // Coin Adjustment Form State
  const [adjustEmail, setAdjustEmail] = useState("");
  const [adjustAmount, setAdjustAmount] = useState("50");
  const [adjustReason, setAdjustReason] = useState("");
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false);

  // Economy & Ledger Control State
  const [economyData, setEconomyData] = useState<any | null>(null);
  const [isLoadingEconomy, setIsLoadingEconomy] = useState(false);
  const [reconciliationReport, setReconciliationReport] = useState<any | null>(null);
  const [isLoadingReconcile, setIsLoadingReconcile] = useState(false);
  const [repairingUserId, setRepairingUserId] = useState<string | null>(null);
  const [economyConfig, setEconomyConfig] = useState<any | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Deposits & Gateways State
  const [deposits, setDeposits] = useState<any[]>([]);
  const [isLoadingDeposits, setIsLoadingDeposits] = useState(false);
  const [depositStatusFilter, setDepositStatusFilter] = useState("ALL");
  const [depositSearch, setDepositSearch] = useState("");
  const [depositPage, setDepositPage] = useState(1);
  const [depositPagination, setDepositPagination] = useState<any>(null);
  const [selectedDeposit, setSelectedDeposit] = useState<any | null>(null);

  // Payment Gateway Config State
  const [paymentConfig, setPaymentConfig] = useState<any | null>(null);
  const [isLoadingPaymentConfig, setIsLoadingPaymentConfig] = useState(false);
  const [isSavingPaymentConfig, setIsSavingPaymentConfig] = useState(false);

  // Reconciliation State
  const [reconcileResult, setReconcileResult] = useState<any | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);

  // Webhook Audit Logs State
  const [webhookEvents, setWebhookEvents] = useState<any[]>([]);
  const [isLoadingWebhooks, setIsLoadingWebhooks] = useState(false);
  const [showWebhooksModal, setShowWebhooksModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [userStatusFilter, userRoleFilter]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const params = new URLSearchParams();
      if (userSearch) params.set("search", userSearch);
      if (userStatusFilter !== "ALL") params.set("status", userStatusFilter);
      if (userRoleFilter !== "ALL") params.set("role", userRoleFilter);

      const res = await fetch(`/api/v1/admin/users?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setUsers(json.data || []);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchSuspicious = async () => {
    setIsLoadingSuspicious(true);
    try {
      const res = await fetch("/api/v1/admin/suspicious-activity");
      if (res.ok) {
        const json = await res.json();
        setSuspiciousData(json.data || { lockedUsers: [], fraudAttempts: [] });
      }
    } catch {
      // Fallback
    } finally {
      setIsLoadingSuspicious(false);
    }
  };

  const handleInspectUser = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/admin/users/${id}`);
      if (res.ok) {
        const json = await res.json();
        setSelectedUser(json.data);
      }
    } catch {
      addToast("Error", "Could not load user details", "error");
    }
  };

  const handleModerateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moderatingUser) return;
    setIsSubmittingModeration(true);

    try {
      const res = await fetch(`/api/v1/admin/users/${moderatingUser.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, reason: moderationReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to update status");

      addToast("Status Updated", `User marked as ${newStatus}.`, "success");
      setModeratingUser(null);
      setModerationReason("");
      fetchUsers();
    } catch (err: any) {
      addToast("Error", err.message, "error");
    } finally {
      setIsSubmittingModeration(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleUser) return;
    setIsSubmittingRole(true);

    try {
      const res = await fetch(`/api/v1/admin/users/${roleUser.id}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole, reason: roleReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to update role");

      addToast("Role Updated", `User role updated to ${newRole}.`, "success");
      setRoleUser(null);
      setRoleReason("");
      fetchUsers();
    } catch (err: any) {
      addToast("Error", err.message, "error");
    } finally {
      setIsSubmittingRole(false);
    }
  };

  const handleExecuteAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustReason.trim() || adjustReason.trim().length < 5) {
      addToast("Reason Required", "Administrative adjustments require a documented audit reason of at least 5 characters.", "error");
      return;
    }
    const amt = parseInt(adjustAmount, 10);
    if (isNaN(amt) || amt === 0) {
      addToast("Invalid Amount", "Enter a non-zero integer amount.", "error");
      return;
    }

    const targetUser = users.find((u) => u.email.toLowerCase() === adjustEmail.trim().toLowerCase());
    if (!targetUser) {
      addToast("User Not Found", `Could not find an active user with email "${adjustEmail}".`, "error");
      return;
    }

    setIsSubmittingAdjustment(true);
    try {
      const res = await fetch("/api/v1/wallet/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: targetUser.id,
          amount: amt,
          reason: adjustReason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to adjust balance");

      addToast("Adjustment Executed", `Processed ${amt > 0 ? "+" : ""}${amt} Coins adjustment for ${adjustEmail}.`, "success");
      setAdjustEmail("");
      setAdjustReason("");
      fetchEconomy();
      fetchUsers();
    } catch (err: any) {
      addToast("Adjustment Failed", err.message, "error");
    } finally {
      setIsSubmittingAdjustment(false);
    }
  };

  const fetchEconomy = async () => {
    setIsLoadingEconomy(true);
    try {
      const res = await fetch("/api/v1/admin/wallet/economy");
      if (res.ok) {
        const json = await res.json();
        setEconomyData(json.data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingEconomy(false);
    }
  };

  const fetchReconciliation = async () => {
    setIsLoadingReconcile(true);
    try {
      const res = await fetch("/api/v1/admin/wallet/reconcile");
      if (res.ok) {
        const json = await res.json();
        setReconciliationReport(json.data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingReconcile(false);
    }
  };

  const handleRepairDiscrepancy = async (userId: string) => {
    setRepairingUserId(userId);
    try {
      const res = await fetch("/api/v1/admin/wallet/repair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          reason: "Administrative reconciliation sync from governance center",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Repair failed");

      addToast("Wallet Reconciled", json.message, "success");
      fetchReconciliation();
      fetchEconomy();
      fetchUsers();
    } catch (err: any) {
      addToast("Repair Failed", err.message, "error");
    } finally {
      setRepairingUserId(null);
    }
  };

  const fetchCoinConfig = async () => {
    setIsLoadingConfig(true);
    try {
      const res = await fetch("/api/v1/admin/wallet/config");
      if (res.ok) {
        const json = await res.json();
        setEconomyConfig(json.data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const handleSaveCoinConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!economyConfig) return;
    setIsSavingConfig(true);
    try {
      const res = await fetch("/api/v1/admin/wallet/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyIssuanceLimit: Number(economyConfig.dailyIssuanceLimit),
          maxWalletBalance: Number(economyConfig.maxWalletBalance),
          minDepositPaise: Number(economyConfig.minDepositPaise),
          promoRewardLimit: Number(economyConfig.promoRewardLimit),
          coinExpiryDays: Number(economyConfig.coinExpiryDays),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to save configuration");

      addToast("Configuration Saved", "Platform coin policies updated with audit log.", "success");
      fetchCoinConfig();
    } catch (err: any) {
      addToast("Save Failed", err.message, "error");
    } finally {
      setIsSavingConfig(false);
    }
  };

  const fetchDeposits = async (page = 1) => {
    setIsLoadingDeposits(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "10");
      if (depositStatusFilter !== "ALL") params.set("status", depositStatusFilter);
      if (depositSearch.trim()) params.set("search", depositSearch.trim());

      const res = await fetch(`/api/v1/admin/deposits?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setDeposits(json.data || []);
        setDepositPagination(json.pagination);
        setDepositPage(page);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingDeposits(false);
    }
  };

  const fetchPaymentConfig = async () => {
    setIsLoadingPaymentConfig(true);
    try {
      const res = await fetch("/api/v1/admin/deposits/config");
      if (res.ok) {
        const json = await res.json();
        setPaymentConfig(json.data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingPaymentConfig(false);
    }
  };

  const handleSavePaymentConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentConfig) return;
    setIsSavingPaymentConfig(true);
    try {
      const res = await fetch("/api/v1/admin/deposits/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          depositsEnabled: paymentConfig.depositsEnabled,
          defaultGateway: paymentConfig.defaultGateway,
          minDepositPaise: Number(paymentConfig.minDepositPaise),
          maxDepositPaise: Number(paymentConfig.maxDepositPaise),
          conversionRatePaise: Number(paymentConfig.conversionRatePaise),
          complianceNotice: paymentConfig.complianceNotice,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to update gateway configuration");

      addToast("Gateway Settings Updated", "Payment parameters and compliance controls saved.", "success");
      fetchPaymentConfig();
    } catch (err: any) {
      addToast("Update Failed", err.message, "error");
    } finally {
      setIsSavingPaymentConfig(false);
    }
  };

  const handleRunReconcile = async () => {
    setIsReconciling(true);
    try {
      const res = await fetch("/api/v1/admin/deposits/reconcile");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Reconciliation failed");

      setReconcileResult(json.data);
      addToast(
        "Reconciliation Complete",
        `Scanned ${json.data.scanned} deposits. ${json.data.expired} expired.`,
        "success"
      );
      fetchDeposits(depositPage);
    } catch (err: any) {
      addToast("Reconcile Error", err.message, "error");
    } finally {
      setIsReconciling(false);
    }
  };

  const fetchWebhooks = async () => {
    setIsLoadingWebhooks(true);
    try {
      const res = await fetch("/api/v1/admin/deposits/webhooks?limit=25");
      if (res.ok) {
        const json = await res.json();
        setWebhookEvents(json.data || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingWebhooks(false);
    }
  };

  useEffect(() => {
    if (activeTab === "DEPOSITS") {
      fetchDeposits(1);
    }
  }, [depositStatusFilter]);

  useEffect(() => {
    fetchAdminProducts();
    fetch('/api/v1/categories')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.data) setCategoriesList(j.data);
      })
      .catch(() => {});
  }, [productStatusFilter]);

  const fetchAdminProducts = async () => {
    setIsLoadingAdminProducts(true);
    try {
      const params = new URLSearchParams();
      if (productStatusFilter !== "ALL") params.set("status", productStatusFilter);
      const res = await fetch(`/api/v1/admin/products?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setAdminProducts(json.data || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingAdminProducts(false);
    }
  };

  const handleModerateProduct = async (slug: string, status: string, reason?: string) => {
    setIsSubmittingProductStatus(true);
    try {
      const res = await fetch(`/api/v1/products/${slug}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rejectionReason: reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to update product status");

      addToast("Status Updated", `Product marked as ${status}.`, "success");
      setModeratingProduct(null);
      setRejectionReason("");
      fetchAdminProducts();
    } catch (err: any) {
      addToast("Error", err.message, "error");
    } finally {
      setIsSubmittingProductStatus(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.title.trim() || !newProduct.categoryId) {
      addToast("Required Fields", "Product title and category are required.", "warning");
      return;
    }
    setIsCreatingProduct(true);
    try {
      const res = await fetch("/api/v1/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newProduct.title.trim(),
          shortDescription: newProduct.shortDescription.trim() || `${newProduct.title.trim()} digital software package.`,
          description: newProduct.description.trim() || `${newProduct.title.trim()} full application codebase.`,
          categoryId: newProduct.categoryId,
          isFree: newProduct.isFree,
          coinPrice: newProduct.isFree ? 0 : Number(newProduct.coinPrice),
          fiatPricePaise: Number(newProduct.fiatPricePaise),
          platforms: newProduct.platforms,
          techStack: newProduct.techStack.split(",").map((s) => s.trim()).filter(Boolean),
          tags: newProduct.tags.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
          demoUrl: newProduct.demoUrl.trim() || undefined,
          initialVersion: {
            version: newProduct.version.trim() || "1.0.0",
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to create product");

      addToast("Product Created", `${newProduct.title} created in draft status.`, "success");
      setShowCreateProductModal(false);
      setNewProduct({
        title: "",
        shortDescription: "",
        description: "",
        categoryId: "",
        coinPrice: 0,
        fiatPricePaise: 0,
        isFree: false,
        platforms: ["Web"],
        techStack: "",
        tags: "",
        demoUrl: "",
        version: "1.0.0",
      });
      fetchAdminProducts();
    } catch (err: any) {
      addToast("Error", err.message, "error");
    } finally {
      setIsCreatingProduct(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header & Persona Notice */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/20">
              Admin Governance Center
            </span>
            <span className="text-xs text-slate-400">Strict Least-Privilege Enforced</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            Platform Operations & Moderation
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => switchRole("SUPER_ADMIN" as any)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Super Admin Mode</span>
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("OVERVIEW")}
          className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === "OVERVIEW"
              ? "border-b-2 border-sky-500 text-sky-600 dark:text-sky-400 font-bold bg-sky-50/50 dark:bg-sky-950/20"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <BarChart3 className="w-4 h-4 text-sky-500" />
          <span>Dashboard Overview</span>
        </button>

        <button
          onClick={() => setActiveTab("USERS")}
          className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === "USERS"
              ? "border-b-2 border-sky-500 text-sky-600 dark:text-sky-400 font-bold bg-sky-50/50 dark:bg-sky-950/20"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users</span>
        </button>

        <button
          onClick={() => setActiveTab("PRODUCTS")}
          className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === "PRODUCTS"
              ? "border-b-2 border-sky-500 text-sky-600 dark:text-sky-400 font-bold bg-sky-50/50 dark:bg-sky-950/20"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Products ({adminProducts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("ORDERS")}
          className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === "ORDERS"
              ? "border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50/50 dark:bg-emerald-950/20"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Orders & Licenses</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("ECONOMY");
            fetchEconomy();
            fetchReconciliation();
            fetchCoinConfig();
          }}
          className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === "ECONOMY"
              ? "border-b-2 border-amber-500 text-amber-600 dark:text-amber-400 font-bold bg-amber-50/50 dark:bg-amber-950/20"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Coins className="w-4 h-4 text-amber-500" />
          <span>Economy & Wallet</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("DEPOSITS");
            fetchDeposits(1);
            fetchPaymentConfig();
          }}
          className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === "DEPOSITS"
              ? "border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50/50 dark:bg-emerald-950/20"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <CreditCard className="w-4 h-4 text-emerald-500" />
          <span>Deposits & Rails</span>
        </button>

        <button
          onClick={() => setActiveTab("TASKS")}
          className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === "TASKS"
              ? "border-b-2 border-amber-500 text-amber-600 dark:text-amber-400 font-bold bg-amber-50/50 dark:bg-amber-950/20"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Zap className="w-4 h-4 text-amber-500" />
          <span>Daily Tasks</span>
        </button>

        <button
          onClick={() => setActiveTab("SHORTLINKS")}
          className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === "SHORTLINKS"
              ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/50 dark:bg-indigo-950/20"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Link2 className="w-4 h-4 text-indigo-500" />
          <span>Short-Links</span>
        </button>

        <button
          onClick={() => setActiveTab("REVIEWS")}
          className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === "REVIEWS"
              ? "border-b-2 border-amber-500 text-amber-600 dark:text-amber-400 font-bold bg-amber-50/50 dark:bg-amber-950/20"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <MessageSquare className="w-4 h-4 text-amber-500" />
          <span>Reviews</span>
        </button>

        <button
          onClick={() => setActiveTab("SETTINGS")}
          className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === "SETTINGS"
              ? "border-b-2 border-sky-500 text-sky-600 dark:text-sky-400 font-bold bg-sky-50/50 dark:bg-sky-950/20"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 text-sky-500" />
          <span>Settings & Audit</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("SUSPICIOUS");
            fetchSuspicious();
          }}
          className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === "SUSPICIOUS"
              ? "border-b-2 border-rose-500 text-rose-600 dark:text-rose-400 font-bold bg-rose-50/50 dark:bg-rose-950/20"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <span>Anti-Fraud</span>
        </button>
      </div>

      {/* 3. Tab Contents */}

      {/* 3.0 Executive Dashboard Overview Tab */}
      {activeTab === "OVERVIEW" && (
        <AdminOverviewTab onNavigateTab={setActiveTab} addToast={addToast} />
      )}

      {/* 3.1 User Management Tab */}
      {activeTab === "USERS" && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
                placeholder="Search by email, username, or name..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="BANNED">Banned</option>
              </select>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">All Roles</option>
                <option value="USER">User</option>
                <option value="PUBLISHER">Publisher</option>
                <option value="MODERATOR">Moderator</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>

              <button
                onClick={fetchUsers}
                className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg"
                title="Refresh user list"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* User Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold">
                  <tr>
                    <th className="p-3.5">Developer / Identity</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Coin Balance</th>
                    <th className="p-3.5">Joined</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        {isLoadingUsers ? "Querying user records..." : "No users matched the criteria."}
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold flex items-center justify-center text-xs">
                              {u.profile?.displayName?.charAt(0) || u.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-slate-100">
                                {u.profile?.displayName || u.profile?.username || "Unnamed"}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {u.roles?.join(", ") || "USER"}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                              u.status === "ACTIVE"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : u.status === "SUSPENDED"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                          {u.wallet?.availableBalance ?? 0} Coins
                        </td>
                        <td className="p-3.5 text-slate-400">{formatDate(u.createdAt)}</td>
                        <td className="p-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleInspectUser(u.id)}
                              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold text-sky-600 dark:text-sky-400"
                            >
                              Inspect
                            </button>
                            <button
                              onClick={() => {
                                setModeratingUser(u);
                                setNewStatus(u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE");
                              }}
                              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold text-amber-600"
                            >
                              Status
                            </button>
                            <button
                              onClick={() => {
                                setRoleUser(u);
                                setNewRole(u.roles?.[0] || "USER");
                              }}
                              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400"
                            >
                              Role
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3.2 Suspicious Activity Tab */}
      {activeTab === "SUSPICIOUS" && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500" />
              <span>Brute-Force Locked & High-Risk Accounts</span>
            </h3>

            {suspiciousData.lockedUsers.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No accounts currently triggered login abuse thresholds.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {suspiciousData.lockedUsers.map((lu) => (
                  <div key={lu.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{lu.email}</div>
                      <div className="text-[11px] text-amber-600">
                        {lu.failedLoginAttempts} consecutive failed attempts • Status: {lu.status}
                      </div>
                    </div>
                    {lu.lockedUntil && (
                      <span className="text-[11px] font-mono text-rose-500 font-bold">
                        Locked Until: {new Date(lu.lockedUntil).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>Anti-Fraud Flagged Task Attempts</span>
            </h3>

            {suspiciousData.fraudAttempts.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No suspicious engagement flags logged.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {suspiciousData.fraudAttempts.map((fa) => (
                  <div key={fa.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {fa.user?.email} • Task: {fa.task?.title}
                      </div>
                      <div className="text-[11px] text-rose-500 font-mono">
                        Flags: {fa.fraudFlags?.join(", ") || "Duration violated"}
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400">{formatDate(fa.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3.3 Product Catalog & Moderation Queue Tab */}
      {activeTab === "PRODUCTS" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            {/* Status Filter Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {["ALL", "PENDING_REVIEW", "PUBLISHED", "DRAFT", "REJECTED", "ARCHIVED"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setProductStatusFilter(st)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    productStatusFilter === st
                      ? "bg-sky-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>

            {/* Actions: Refresh & Create Product */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={fetchAdminProducts}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                title="Refresh Products"
              >
                <RefreshCw size={15} className={isLoadingAdminProducts ? "animate-spin" : ""} />
              </button>
              <button
                type="button"
                onClick={() => setShowCreateProductModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Package size={14} />
                <span>Create Digital Product</span>
              </button>
            </div>
          </div>

          {/* Products List */}
          {isLoadingAdminProducts ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading catalog products...</div>
          ) : adminProducts.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              No products found for the selected status filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {adminProducts.map((p) => {
                const currentVersion = p.versions?.find((v: any) => v.isCurrent) || p.versions?.[0];
                return (
                  <div
                    key={p.id}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            p.status === "PUBLISHED"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : p.status === "PENDING_REVIEW"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse"
                              : p.status === "REJECTED"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                              : p.status === "ARCHIVED"
                              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {p.status.replace("_", " ")}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {p.category?.name || "Category"}
                        </span>
                        {p.isFree ? (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500 text-white">
                            Free
                          </span>
                        ) : (
                          <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                            {p.coinPrice} Coins (₹{Math.round(p.fiatPricePaise / 100)})
                          </span>
                        )}
                        <span className="text-xs font-mono text-slate-400">
                          v{currentVersion?.version || "1.0.0"}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                        {p.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        Publisher: {p.publisher?.profile?.displayName || p.publisher?.email} • Platforms: {p.platforms?.join(", ")}
                      </p>

                      {p.rejectionReason && (
                        <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/30 p-2 rounded-lg border border-rose-200 dark:border-rose-900/50">
                          <strong>Rejection reason:</strong> {p.rejectionReason}
                        </p>
                      )}
                    </div>

                    {/* Moderation Controls */}
                    <div className="flex items-center gap-1.5 flex-wrap self-end md:self-center">
                      <Link
                        href={`/products/${p.slug}`}
                        target="_blank"
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1"
                      >
                        <ExternalLink size={13} /> View
                      </Link>

                      {p.status !== "PUBLISHED" && (
                        <button
                          type="button"
                          onClick={() => handleModerateProduct(p.slug, "PUBLISHED")}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 size={13} /> Publish
                        </button>
                      )}

                      {p.status === "PUBLISHED" && (
                        <button
                          type="button"
                          onClick={() => handleModerateProduct(p.slug, "DRAFT")}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                        >
                          Unpublish
                        </button>
                      )}

                      {p.status !== "REJECTED" && (
                        <button
                          type="button"
                          onClick={() => {
                            setModeratingProduct(p);
                            setRejectionReason("");
                          }}
                          className="px-2.5 py-1.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      )}

                      {p.status !== "ARCHIVED" && (
                        <button
                          type="button"
                          onClick={() => handleModerateProduct(p.slug, "ARCHIVED")}
                          className="px-2.5 py-1.5 rounded-xl border border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 font-semibold text-xs cursor-pointer"
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3.4 Economy & Ledger Governance Tab */}
      {activeTab === "ECONOMY" && (
        <div className="space-y-6">
          {/* Economy KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-semibold">Circulating Coin Supply</span>
                <Coins className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                {formatCoins(economyData?.metrics?.totalCirculation ?? 13000)} Coins
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Total available balance across {economyData?.metrics?.totalWallets ?? 3} wallets
              </span>
            </div>

            <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-semibold">Held in Escrow</span>
                <Lock className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                {formatCoins(economyData?.metrics?.totalHeld ?? 0)} Coins
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Active in-flight order commitments
              </span>
            </div>

            <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-semibold">24h Transaction Volume</span>
                <BarChart3 className="w-4 h-4 text-sky-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                {formatCoins(Math.abs(economyData?.metrics?.volume24h ?? 0))} Coins
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {economyData?.metrics?.txCount24h ?? 0} transactions in last 24 hours
              </span>
            </div>

            <div className={`p-5 rounded-3xl border shadow-2xs ${
              economyData?.auditSummary?.isSystemSound !== false
                ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-900 dark:text-emerald-200"
                : "border-rose-500/30 bg-rose-500/10 text-rose-900 dark:text-rose-200"
            }`}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold">Ledger Integrity Status</span>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xl font-extrabold flex items-center gap-2">
                <span>{economyData?.auditSummary?.isSystemSound !== false ? "100% SOUND" : "VARIANCE DETECTED"}</span>
              </div>
              <span className="text-[11px] opacity-80 mt-1 block">
                {economyData?.auditSummary?.consistentWallets ?? 3} wallets balanced, {economyData?.auditSummary?.discrepancyWallets ?? 0} discrepancies
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Reconciliation Scanner */}
            <div className="lg:col-span-2 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <span>System-Wide Double-Entry Reconciliation Scanner</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Audits every wallet balance against the exact sum of append-only ledger entries.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchReconciliation}
                  disabled={isLoadingReconcile}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-500/20 hover:bg-sky-100 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingReconcile ? "animate-spin" : ""}`} />
                  <span>{isLoadingReconcile ? "Auditing..." : "Run Audit Scan"}</span>
                </button>
              </div>

              {/* Scanned Wallets Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 uppercase text-[10px] font-mono border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Account Email</th>
                      <th className="py-2.5 px-3 text-right">Cached Balance</th>
                      <th className="py-2.5 px-3 text-right">Ledger Sum</th>
                      <th className="py-2.5 px-3 text-center">Variance</th>
                      <th className="py-2.5 px-3 text-center">Integrity</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {reconciliationReport?.wallets?.map((w: any) => (
                      <tr key={w.walletId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">
                          {w.userEmail}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          {formatCoins(w.availableBalance)} Coins
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          {formatCoins(w.ledgerSum)} Coins
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          <span className={w.discrepancy === 0 ? "text-slate-400" : "text-rose-500 font-bold"}>
                            {w.discrepancy === 0 ? "0" : `${w.discrepancy > 0 ? "+" : ""}${w.discrepancy}`}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            w.isConsistent
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                          }`}>
                            {w.isConsistent ? "BALANCED" : "DISCREPANCY"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {!w.isConsistent ? (
                            <button
                              type="button"
                              onClick={() => handleRepairDiscrepancy(w.userId)}
                              disabled={repairingUserId === w.userId}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
                            >
                              {repairingUserId === w.userId ? "Repairing..." : "Auto-Repair"}
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-mono">Verified</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Audited Manual Coin Adjustment Tool */}
            <form
              onSubmit={handleExecuteAdjustment}
              className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4"
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-indigo-500" />
                <span>Audited Adjustment Tool</span>
              </h3>
              <p className="text-xs text-slate-500">
                Requires server-side role permission and mandatory audit reason.
              </p>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target User</label>
                  <select
                    value={adjustEmail}
                    onChange={(e) => setAdjustEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs cursor-pointer"
                  >
                    <option value="">Select target account...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.email}>
                        {u.email} ({u.role}) — {formatCoins(u.wallet?.availableBalance ?? 0)} Coins
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Coin Delta (+ or -)</label>
                  <input
                    type="number"
                    required
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    placeholder="e.g. +250 or -100"
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-400">Positive values credit coins; negative debit coins.</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mandatory Audit Reason (min 5 chars)</label>
                  <textarea
                    required
                    minLength={5}
                    rows={3}
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="Resolution for ticket #9921 / Promotional compensation..."
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingAdjustment || !adjustEmail || adjustReason.length < 5}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md disabled:opacity-50 cursor-pointer transition-colors"
              >
                {isSubmittingAdjustment ? "Processing ACID Transaction..." : "Commit Audited Adjustment"}
              </button>
            </form>
          </div>

          {/* Platform Coin Policies & Configuration */}
          {economyConfig && (
            <form
              onSubmit={handleSaveCoinConfig}
              className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-slate-500" />
                  <span>Platform Coin Economy Rules & Policies</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">Strictly Enforced Server-Side</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Daily Issuance Limit</label>
                  <input
                    type="number"
                    value={economyConfig.dailyIssuanceLimit}
                    onChange={(e) => setEconomyConfig({ ...economyConfig, dailyIssuanceLimit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono"
                  />
                  <span className="text-[10px] text-slate-400">Platform-wide max coins minted/day</span>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Max Wallet Balance</label>
                  <input
                    type="number"
                    value={economyConfig.maxWalletBalance}
                    onChange={(e) => setEconomyConfig({ ...economyConfig, maxWalletBalance: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono"
                  />
                  <span className="text-[10px] text-slate-400">Max coins a single user wallet can hold</span>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Min Deposit (Paise)</label>
                  <input
                    type="number"
                    value={economyConfig.minDepositPaise}
                    onChange={(e) => setEconomyConfig({ ...economyConfig, minDepositPaise: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono"
                  />
                  <span className="text-[10px] text-slate-400">10000 paise = ₹100.00</span>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Max Promo Reward</label>
                  <input
                    type="number"
                    value={economyConfig.promoRewardLimit}
                    onChange={(e) => setEconomyConfig({ ...economyConfig, promoRewardLimit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono"
                  />
                  <span className="text-[10px] text-slate-400">Max promo coins in 24 hours</span>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Coin Expiry Policy (Days)</label>
                  <input
                    type="number"
                    value={economyConfig.coinExpiryDays}
                    onChange={(e) => setEconomyConfig({ ...economyConfig, coinExpiryDays: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono"
                  />
                  <span className="text-[10px] text-slate-400">0 = Coins never expire</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  {isSavingConfig ? "Saving..." : "Save Policy Configuration"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 3.5 Deposits & Payment Gateways Tab */}
      {activeTab === "DEPOSITS" && (
        <div className="space-y-6">
          {/* Top Metrics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Gateway Status</span>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full ${
                      paymentConfig?.depositsEnabled ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                    }`}
                  />
                  <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {paymentConfig?.depositsEnabled ? "Deposits Active" : "Disabled (Gated)"}
                  </span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Completed</span>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                  ₹
                  {(
                    deposits
                      .filter((d) => d.status === "COMPLETED")
                      .reduce((acc, d) => acc + (d.amountFiatPaise || 0), 0) / 100
                  ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <IndianRupee className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Transactions</span>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                  {depositPagination?.total || deposits.length} Records
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <History className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Webhook Logs</span>
                <button
                  type="button"
                  onClick={() => {
                    fetchWebhooks();
                    setShowWebhooksModal(true);
                  }}
                  className="mt-1 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Inspect Deliveries <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <FileText className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Compliance & Gateway Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gateway Settings Form */}
            <div className="lg:col-span-2 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-500" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Payment Gateway & Compliance Controls
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Rule 6 & Rule 7 Protected</span>
              </div>

              {/* Compliance Warning Banner */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">Indian Regulatory & Provider Compliance Gate:</span> Deposits must remain disabled
                  unless the active payment provider has reviewed and approved your digital goods merchant category. Production deposits
                  never simulate fake success.
                </div>
              </div>

              {paymentConfig && (
                <form onSubmit={handleSavePaymentConfig} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Master Switch */}
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">Enable User Deposits</div>
                        <div className="text-[10px] text-slate-400">Master switch allowing fiat checkouts</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={paymentConfig.depositsEnabled}
                        onChange={(e) => setPaymentConfig({ ...paymentConfig, depositsEnabled: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                      />
                    </div>

                    {/* Default Gateway Adapter */}
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1">
                      <label className="font-bold text-slate-900 dark:text-slate-100">Active Payment Adapter</label>
                      <select
                        value={paymentConfig.defaultGateway}
                        onChange={(e) => setPaymentConfig({ ...paymentConfig, defaultGateway: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold"
                      >
                        <option value="RAZORPAY">Razorpay (UPI, NetBanking, Cards - India)</option>
                        <option value="SANDBOX">Sandbox Adapter (Local Development & Testing)</option>
                      </select>
                    </div>

                    {/* Min Deposit */}
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">Min Deposit (Paise)</label>
                      <input
                        type="number"
                        value={paymentConfig.minDepositPaise}
                        onChange={(e) => setPaymentConfig({ ...paymentConfig, minDepositPaise: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs"
                      />
                      <span className="text-[10px] text-slate-400">10000 paise = ₹100.00 minimum</span>
                    </div>

                    {/* Max Deposit */}
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">Max Deposit (Paise)</label>
                      <input
                        type="number"
                        value={paymentConfig.maxDepositPaise}
                        onChange={(e) => setPaymentConfig({ ...paymentConfig, maxDepositPaise: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs"
                      />
                      <span className="text-[10px] text-slate-400">5000000 paise = ₹50,000.00 maximum</span>
                    </div>

                    {/* Conversion Rate */}
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">Conversion Rate (Paise / Coin)</label>
                      <input
                        type="number"
                        value={paymentConfig.conversionRatePaise}
                        onChange={(e) => setPaymentConfig({ ...paymentConfig, conversionRatePaise: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs"
                      />
                      <span className="text-[10px] text-slate-400">100 paise = ₹1.00 per 1 CPC Coin</span>
                    </div>

                    {/* Public Key Display */}
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">Public Gateway Key ID</label>
                      <input
                        type="text"
                        readOnly
                        value={paymentConfig.razorpayKeyId || "rzp_test_cpc_market"}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-xs cursor-not-allowed"
                      />
                      <span className="text-[10px] text-slate-400">Key Secret safely hidden on server</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Compliance & Regulatory Notice</label>
                    <input
                      type="text"
                      value={paymentConfig.complianceNotice || ""}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, complianceNotice: e.target.value })}
                      placeholder="e.g. Deposits enabled for verified sandbox & approved Indian payment rails."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSavingPaymentConfig}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSavingPaymentConfig ? "Saving..." : "Save Gateway Configuration"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Reconciliation Control */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <RefreshCw className="w-4 h-4 text-sky-500" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Payment Event Reconciliation
                  </h3>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Automated background reconciliation detects stale pending deposits (&gt;30 mins old),
                  syncs payment status with providers, and marks abandoned intents as <span className="font-mono text-rose-500">EXPIRED</span>.
                </p>

                {reconcileResult && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                    <div className="font-bold text-slate-800 dark:text-slate-200">Last Reconciliation Report:</div>
                    <div className="flex justify-between text-slate-500">
                      <span>Deposits Scanned:</span>
                      <span className="font-mono font-bold">{reconcileResult.scanned}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Stale Expired:</span>
                      <span className="font-mono font-bold text-rose-500">{reconcileResult.expired}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Status:</span>
                      <span className="font-mono font-bold text-emerald-500">Synced</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <button
                  type="button"
                  onClick={handleRunReconcile}
                  disabled={isReconciling}
                  className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isReconciling ? "animate-spin" : ""}`} />
                  <span>{isReconciling ? "Scanning Ledger..." : "Run Reconciliation Scanner"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Deposits Ledger Table */}
          <div className="space-y-3">
            {/* Filter and Search Bar */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={depositSearch}
                  onChange={(e) => setDepositSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchDeposits(1)}
                  placeholder="Search by Deposit ID, Gateway Order ID, or User Email..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={depositStatusFilter}
                  onChange={(e) => setDepositStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                  <option value="REFUNDED">Refunded</option>
                </select>

                <button
                  type="button"
                  onClick={() => fetchDeposits(depositPage)}
                  className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg cursor-pointer"
                  title="Refresh deposits"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingDeposits ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold">
                    <tr>
                      <th className="p-3.5">Reference ID</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Fiat Paid</th>
                      <th className="p-3.5">Coins Credited</th>
                      <th className="p-3.5">Gateway & Order</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Timestamp</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 font-mono">
                    {isLoadingDeposits ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 font-sans">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-500" />
                          Loading deposit records...
                        </td>
                      </tr>
                    ) : deposits.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 font-sans">
                          No deposit records match your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      deposits.map((dep) => (
                        <tr key={dep.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100 font-mono">
                            {dep.id.slice(0, 10)}...
                          </td>
                          <td className="p-3.5 font-sans">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {dep.user?.email || "Unknown"}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {dep.user?.profile?.displayName || "—"}
                            </div>
                          </td>
                          <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                            ₹{(dep.amountFiatPaise / 100).toFixed(2)}
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              +{formatCoins(dep.coinsToCredit)}
                            </span>
                          </td>
                          <td className="p-3.5 font-sans">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {dep.gateway}
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[120px]">
                              {dep.gatewayOrderId || "—"}
                            </div>
                          </td>
                          <td className="p-3.5 font-sans">
                            {dep.status === "COMPLETED" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" /> COMPLETED
                              </span>
                            )}
                            {dep.status === "PENDING" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                <Clock className="w-3 h-3" /> PENDING
                              </span>
                            )}
                            {dep.status === "FAILED" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                <XCircle className="w-3 h-3" /> FAILED
                              </span>
                            )}
                            {dep.status === "REFUNDED" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                REFUNDED
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-slate-400 font-sans text-[11px]">
                            {formatDate(dep.createdAt)}
                          </td>
                          <td className="p-3.5 text-right font-sans">
                            <button
                              type="button"
                              onClick={() => setSelectedDeposit(dep)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Receipt</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {depositPagination && depositPagination.pages > 1 && (
                <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <div>
                    Page {depositPagination.page} of {depositPagination.pages} ({depositPagination.total} total)
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={depositPagination.page <= 1}
                      onClick={() => fetchDeposits(depositPage - 1)}
                      className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={depositPagination.page >= depositPagination.pages}
                      onClick={() => fetchDeposits(depositPage + 1)}
                      className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3.6 Tasks & Rewards Tab */}
      {activeTab === "TASKS" && (
        <AdminTasksTab addToast={addToast} />
      )}

      {/* 3.7 Short-Links & Callbacks Tab */}
      {activeTab === "SHORTLINKS" && (
        <AdminShortlinksTab />
      )}

      {/* 3.8 Orders & License Entitlements Tab */}
      {activeTab === "ORDERS" && (
        <AdminOrdersTab addToast={addToast} />
      )}

      {/* 3.9 Reviews & Content Moderation Tab */}
      {activeTab === "REVIEWS" && (
        <AdminReviewsTab addToast={addToast} />
      )}

      {/* 3.10 Platform Governance Policies & Audit Logs Tab */}
      {activeTab === "SETTINGS" && (
        <AdminSettingsTab addToast={addToast} />
      )}

      {/* 4. Modals */}

      {/* Status Moderation Modal */}
      {moderatingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleModerateStatus}
            className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Moderate User Status
            </h3>
            <p className="text-xs text-slate-500">
              Target: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{moderatingUser.email}</span>
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">New Account Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
              >
                <option value="ACTIVE">ACTIVE (Reactivate account)</option>
                <option value="SUSPENDED">SUSPENDED (Restrict transactions & revoke sessions)</option>
                <option value="BANNED">BANNED (Permanent termination)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Audit Reason (Mandatory min 5 chars)</label>
              <textarea
                required
                minLength={5}
                rows={3}
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                placeholder="Reason for suspension or reactivation..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModeratingUser(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingModeration || moderationReason.length < 5}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold disabled:opacity-50"
              >
                {isSubmittingModeration ? "Submitting..." : "Apply Status Change"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Role Management Modal */}
      {roleUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateRole}
            className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Manage User Role
            </h3>
            <p className="text-xs text-slate-500">
              Target: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{roleUser.email}</span>
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Assign Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
              >
                <option value="USER">USER (Standard marketplace customer)</option>
                <option value="PUBLISHER">PUBLISHER (Can submit and publish products)</option>
                <option value="MODERATOR">MODERATOR (Review moderator & support)</option>
                <option value="ADMIN">ADMIN (Operations administrator)</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN (Root platform access)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Audit Reason</label>
              <textarea
                required
                minLength={5}
                rows={2}
                value={roleReason}
                onChange={(e) => setRoleReason(e.target.value)}
                placeholder="Reason for role change..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRoleUser(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingRole || roleReason.length < 5}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50"
              >
                {isSubmittingRole ? "Updating..." : "Save Role"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User Inspect Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                User Record Inspection
              </h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                Close
              </button>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-lg text-slate-900 dark:text-slate-100">
                {selectedUser.profile?.displayName || selectedUser.email}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                ID: {selectedUser.id} • Status: {selectedUser.status}
              </div>
            </div>

            {/* Wallet summary */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500">Available Coins</span>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
                  {selectedUser.wallet?.availableBalance ?? 0}
                </div>
              </div>
              <div className="text-right text-xs text-slate-400">
                <div>Total Earned: {selectedUser.wallet?.totalEarned ?? 0}</div>
                <div>Total Spent: {selectedUser.wallet?.totalSpent ?? 0}</div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase text-slate-400">Recent Purchases</h4>
              {selectedUser.orders?.length === 0 ? (
                <p className="text-xs text-slate-400">No purchases found.</p>
              ) : (
                <div className="space-y-1.5 text-xs">
                  {selectedUser.orders?.map((ord: any) => (
                    <div key={ord.id} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between">
                      <span>Order #{ord.orderNumber}</span>
                      <span className="font-mono font-bold">{ord.totalCoins} Coins</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Sessions */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase text-slate-400">Active Sessions</h4>
              {selectedUser.sessions?.length === 0 ? (
                <p className="text-xs text-slate-400">No active device sessions.</p>
              ) : (
                <div className="space-y-1.5 text-xs">
                  {selectedUser.sessions?.map((sess: any) => (
                    <div key={sess.id} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="font-semibold">{sess.userAgent.slice(0, 50)}...</div>
                      <div className="text-[11px] text-slate-400">IP: {sess.ipAddress} • {formatDate(sess.createdAt)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Rejection Reason Modal */}
      {moderatingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-500" />
              <span>Reject Product Submission</span>
            </h3>
            <p className="text-xs text-slate-500">
              Provide an authoritative feedback reason for rejecting &quot;{moderatingProduct.title}&quot;.
            </p>
            <div>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Missing required setup instructions, defective build, or security vulnerability..."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 resize-none focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModeratingProduct(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingProductStatus || !rejectionReason.trim()}
                onClick={() => handleModerateProduct(moderatingProduct.slug, "REJECTED", rejectionReason)}
                className="px-4 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingProductStatus ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Digital Product Modal */}
      {showCreateProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-sky-500" />
                <span>Create Digital Product / Source Code</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateProductModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  value={newProduct.title}
                  onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                  placeholder="e.g. ApexCRM — Enterprise Customer Management System"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={newProduct.categoryId}
                    onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="">Select a Category</option>
                    {categoriesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Initial SemVer Version
                  </label>
                  <input
                    type="text"
                    value={newProduct.version}
                    onChange={(e) => setNewProduct({ ...newProduct, version: e.target.value })}
                    placeholder="1.0.0"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Short Description *
                </label>
                <input
                  type="text"
                  required
                  value={newProduct.shortDescription}
                  onChange={(e) => setNewProduct({ ...newProduct, shortDescription: e.target.value })}
                  placeholder="Brief 1-2 sentence marketing overview for product card"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Description & Specifications
                </label>
                <textarea
                  rows={3}
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Comprehensive description of features, technical requirements, and usage..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Is Free Product?
                  </label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="isFreeCheckbox"
                      checked={newProduct.isFree}
                      onChange={(e) => setNewProduct({ ...newProduct, isFree: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="isFreeCheckbox" className="text-xs text-slate-600 dark:text-slate-300">
                      Free of Charge
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Coin Price (CPC Coins)
                  </label>
                  <input
                    type="number"
                    disabled={newProduct.isFree}
                    value={newProduct.coinPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, coinPrice: parseInt(e.target.value || "0", 10) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Reference Price (Paise)
                  </label>
                  <input
                    type="number"
                    value={newProduct.fiatPricePaise}
                    onChange={(e) => setNewProduct({ ...newProduct, fiatPricePaise: parseInt(e.target.value || "0", 10) })}
                    placeholder="e.g. 29900 = ₹299"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Supported Platforms
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {["Web", "Android", "iOS", "Linux", "macOS", "Windows", "Docker"].map((plat) => {
                    const isSelected = newProduct.platforms.includes(plat);
                    return (
                      <button
                        type="button"
                        key={plat}
                        onClick={() => {
                          const updated = isSelected
                            ? newProduct.platforms.filter((p) => p !== plat)
                            : [...newProduct.platforms, plat];
                          setNewProduct({ ...newProduct, platforms: updated.length > 0 ? updated : ["Web"] });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-sky-600 text-white shadow-xs"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {plat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tech Stack (Comma Separated)
                </label>
                <input
                  type="text"
                  value={newProduct.techStack}
                  onChange={(e) => setNewProduct({ ...newProduct, techStack: e.target.value })}
                  placeholder="e.g. Next.js 16, TypeScript, Tailwind CSS, PostgreSQL"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateProductModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingProduct}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isCreatingProduct ? "Creating..." : "Save Product (DRAFT)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Receipt Modal */}
      {selectedDeposit && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" />
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Official Deposit Receipt
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDeposit(null)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Deposit ID:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{selectedDeposit.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Customer Email:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{selectedDeposit.user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Paid (Fiat):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  ₹{(selectedDeposit.amountFiatPaise / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">CPC Coins Credited:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  +{formatCoins(selectedDeposit.coinsToCredit)} Coins
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Gateway:</span>
                <span className="font-bold">{selectedDeposit.gateway}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gateway Order ID:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {selectedDeposit.gatewayOrderId || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gateway Payment ID:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {selectedDeposit.gatewayPaymentId || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Deposit Status:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                  {selectedDeposit.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Initiated At:</span>
                <span>{formatDate(selectedDeposit.createdAt)}</span>
              </div>
              {selectedDeposit.completedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Completed At:</span>
                  <span>{formatDate(selectedDeposit.completedAt)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedDeposit(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold cursor-pointer"
              >
                Dismiss Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Webhooks Delivery Audit Modal */}
      {showWebhooksModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[85vh] p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-500" />
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Raw Webhook Delivery Audit Log
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWebhooksModal(false)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {isLoadingWebhooks ? (
                <div className="p-8 text-center text-slate-400">Loading incoming webhook logs...</div>
              ) : webhookEvents.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No webhook deliveries recorded yet.</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {webhookEvents.map((evt) => (
                    <div key={evt.id} className="py-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {evt.eventId}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            evt.processed
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {evt.processed ? "PROCESSED" : "FAILED / UNPROCESSED"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span>Gateway: <strong className="font-mono">{evt.gateway}</strong></span>
                        <span>Type: <strong className="font-mono">{evt.eventType}</strong></span>
                        <span>Received: {formatDate(evt.createdAt)}</span>
                      </div>
                      {evt.error && (
                        <div className="text-[11px] text-rose-500 font-mono">Error: {evt.error}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowWebhooksModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
