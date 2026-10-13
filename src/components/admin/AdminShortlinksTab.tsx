'use client';

import React, { useState, useEffect } from 'react';
import {
  Link2,
  Shield,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Key,
  Lock,
  ExternalLink,
  Layers,
  Activity,
  Check,
  Power,
  Edit,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface ProviderItem {
  id: string;
  name: string;
  slug: string;
  baseUrl: string;
  apiKeyMasked: string | null;
  webhookSecretMasked: string | null;
  campaignId: string | null;
  permittedDomains: string[];
  verificationType: string;
  isEnabled: boolean;
  tasksCount: number;
  eventsCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CallbackEventItem {
  id: string;
  providerSlug: string;
  providerName: string;
  providerEventId: string | null;
  attemptId: string | null;
  verificationResult: string;
  rejectionReason: string | null;
  rewardStatus: string;
  clientIp: string | null;
  metadata: any;
  createdAt: string;
}

export function AdminShortlinksTab() {
  const [subTab, setSubTab] = useState<'PROVIDERS' | 'EVENTS'>('PROVIDERS');

  // Providers state
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [isSubmittingProvider, setIsSubmittingProvider] = useState(false);
  const [providerForm, setProviderForm] = useState({
    name: '',
    slug: '',
    baseUrl: '',
    apiKey: '',
    webhookSecret: '',
    campaignId: '',
    permittedDomains: '',
    verificationType: 'SIGNED_POSTBACK',
    isEnabled: true,
  });

  // Callback events state
  const [events, setEvents] = useState<CallbackEventItem[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventFilterResult, setEventFilterResult] = useState('ALL');
  const [eventSearch, setEventSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<CallbackEventItem | null>(null);

  const fetchProviders = async () => {
    try {
      setIsLoadingProviders(true);
      const res = await fetch('/api/v1/admin/shortlinks/providers');
      const json = await res.json();
      if (res.ok && json.success) {
        setProviders(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load providers:', err);
    } finally {
      setIsLoadingProviders(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setIsLoadingEvents(true);
      const params = new URLSearchParams();
      if (eventFilterResult !== 'ALL') {
        params.set('verificationResult', eventFilterResult);
      }
      if (eventSearch) {
        params.set('search', eventSearch);
      }

      const res = await fetch(`/api/v1/admin/shortlinks/events?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setEvents(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load callback events:', err);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    if (subTab === 'EVENTS') {
      fetchEvents();
    }
  }, [subTab, eventFilterResult]);

  const handleToggleProvider = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/admin/shortlinks/providers/${id}/toggle`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchProviders();
      }
    } catch (err) {
      console.error('Failed to toggle provider:', err);
    }
  };

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProvider(true);
    try {
      const payload = {
        name: providerForm.name,
        slug: providerForm.slug.toLowerCase().trim(),
        baseUrl: providerForm.baseUrl,
        apiKey: providerForm.apiKey || undefined,
        webhookSecret: providerForm.webhookSecret || undefined,
        campaignId: providerForm.campaignId || undefined,
        permittedDomains: providerForm.permittedDomains
          ? providerForm.permittedDomains.split(',').map((d) => d.trim()).filter(Boolean)
          : [],
        verificationType: providerForm.verificationType,
        isEnabled: providerForm.isEnabled,
      };

      const res = await fetch('/api/v1/admin/shortlinks/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error?.message || 'Failed to create provider');
        return;
      }

      setShowProviderModal(false);
      setProviderForm({
        name: '',
        slug: '',
        baseUrl: '',
        apiKey: '',
        webhookSecret: '',
        campaignId: '',
        permittedDomains: '',
        verificationType: 'SIGNED_POSTBACK',
        isEnabled: true,
      });
      fetchProviders();
    } catch (err) {
      console.error('Error creating provider:', err);
    } finally {
      setIsSubmittingProvider(false);
    }
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> VERIFIED
          </span>
        );
      case 'DUPLICATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <Clock className="w-3 h-3" /> DUPLICATE
          </span>
        );
      case 'INVALID_SIGNATURE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <XCircle className="w-3 h-3" /> INVALID SIG
          </span>
        );
      case 'UNSUPPORTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" /> MANUAL/PENDING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
            {result}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Subtab Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div className="flex gap-2">
          <button
            onClick={() => setSubTab('PROVIDERS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              subTab === 'PROVIDERS'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted/60'
            }`}
          >
            <Link2 className="w-4 h-4" />
            Configured Providers ({providers.length})
          </button>
          <button
            onClick={() => setSubTab('EVENTS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              subTab === 'EVENTS'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted/60'
            }`}
          >
            <Activity className="w-4 h-4" />
            Callback Event Log
          </button>
        </div>

        {subTab === 'PROVIDERS' && (
          <button
            onClick={() => setShowProviderModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Short-Link Provider
          </button>
        )}

        {subTab === 'EVENTS' && (
          <button
            onClick={fetchEvents}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card font-semibold text-sm hover:bg-muted/50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Events
          </button>
        )}
      </div>

      {/* SUBTAB 1: PROVIDERS */}
      {subTab === 'PROVIDERS' && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border bg-muted/20">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Supported Shortlink Network Adapters
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Rule 8 Compliant: API credentials and verification secrets are stored strictly on the server and masked in client bundles.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Base URL</th>
                  <th className="py-3 px-4">Verification Type</th>
                  <th className="py-3 px-4">Credentials</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoadingProviders ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      Loading short-link providers...
                    </td>
                  </tr>
                ) : providers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No shortlink providers configured yet. Click &apos;Add Short-Link Provider&apos; to register one.
                    </td>
                  </tr>
                ) : (
                  providers.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {p.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">
                        {p.slug}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-muted-foreground truncate max-w-[200px]">
                        {p.baseUrl}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            p.verificationType === 'SIGNED_POSTBACK'
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          }`}
                        >
                          {p.verificationType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs space-y-1">
                        <div className="flex items-center gap-1 font-mono text-muted-foreground">
                          <Key className="w-3 h-3 text-muted-foreground" />
                          <span>{p.apiKeyMasked || 'None'}</span>
                        </div>
                        <div className="flex items-center gap-1 font-mono text-muted-foreground">
                          <Lock className="w-3 h-3 text-muted-foreground" />
                          <span>{p.webhookSecretMasked || 'None'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            p.isEnabled
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              p.isEnabled ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {p.isEnabled ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleToggleProvider(p.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                            p.isEnabled
                              ? 'border-rose-500/30 text-rose-500 hover:bg-rose-500/10'
                              : 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10'
                          }`}
                        >
                          {p.isEnabled ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: CALLBACK EVENT LOG */}
      {subTab === 'EVENTS' && (
        <div className="space-y-4">
          {/* Filters strip */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by attempt ID, event ID, or reason..."
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchEvents()}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <select
              value={eventFilterResult}
              onChange={(e) => setEventFilterResult(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-card text-sm font-medium focus:outline-none"
            >
              <option value="ALL">All Outcomes</option>
              <option value="VERIFIED">Verified (Rewarded)</option>
              <option value="DUPLICATE">Duplicate (Idempotent)</option>
              <option value="INVALID_SIGNATURE">Invalid Signature</option>
              <option value="UNSUPPORTED">Unsupported / Manual</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Provider</th>
                    <th className="py-3 px-4">Event ID</th>
                    <th className="py-3 px-4">Attempt Reference</th>
                    <th className="py-3 px-4">Result</th>
                    <th className="py-3 px-4">Reward Status</th>
                    <th className="py-3 px-4 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoadingEvents ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        Loading callback logs...
                      </td>
                    </tr>
                  ) : events.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        No callback events recorded yet.
                      </td>
                    </tr>
                  ) : (
                    events.map((e) => (
                      <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(e.createdAt)}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-foreground">
                          {e.providerName}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">
                          {e.providerEventId ? `${e.providerEventId.slice(0, 10)}...` : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">
                          {e.attemptId ? `${e.attemptId.slice(0, 8)}...` : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4">
                          {getResultBadge(e.verificationResult)}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold">
                          <span
                            className={
                              e.rewardStatus === 'REWARDED'
                                ? 'text-emerald-500'
                                : e.rewardStatus === 'ALREADY_COMPLETED'
                                ? 'text-blue-500'
                                : 'text-muted-foreground'
                            }
                          >
                            {e.rewardStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedEvent(e)}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Inspect Redacted Payload"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
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

      {/* INSPECT EVENT MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-foreground">Callback Event Details</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Provider:</span>
                <span className="font-semibold">{selectedEvent.providerName} ({selectedEvent.providerSlug})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Event ID:</span>
                <span className="font-mono">{selectedEvent.providerEventId || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Attempt ID:</span>
                <span className="font-mono">{selectedEvent.attemptId || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Result:</span>
                <span>{getResultBadge(selectedEvent.verificationResult)}</span>
              </div>
              {selectedEvent.rejectionReason && (
                <div className="flex justify-between text-rose-500">
                  <span>Rejection Reason:</span>
                  <span className="font-medium text-right">{selectedEvent.rejectionReason}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reward Status:</span>
                <span className="font-semibold">{selectedEvent.rewardStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Client IP:</span>
                <span className="font-mono">{selectedEvent.clientIp || 'Redacted'}</span>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-1">
                Sanitized Payload (Secrets Redacted):
              </div>
              <pre className="bg-muted/40 border border-border rounded-xl p-3 text-[11px] font-mono overflow-x-auto max-h-48 text-foreground">
                {JSON.stringify(selectedEvent.metadata, null, 2)}
              </pre>
            </div>

            <button
              onClick={() => setSelectedEvent(null)}
              className="w-full py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}

      {/* CREATE PROVIDER MODAL */}
      {showProviderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-foreground">Add Short-Link Provider</h3>
              <button
                onClick={() => setShowProviderModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProvider} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">Provider Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GPLinks, ShrinkMe, AdLinkFly"
                  value={providerForm.name}
                  onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Slug Identifier</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. gplinks, signed-postback, shrinkme"
                  value={providerForm.slug}
                  onChange={(e) => setProviderForm({ ...providerForm, slug: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Base URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://gplinks.com/api or https://provider.com/postback"
                  value={providerForm.baseUrl}
                  onChange={(e) => setProviderForm({ ...providerForm, baseUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Verification Type</label>
                <select
                  value={providerForm.verificationType}
                  onChange={(e) => setProviderForm({ ...providerForm, verificationType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none"
                >
                  <option value="SIGNED_POSTBACK">Signed Postback (HMAC-SHA256 Webhook)</option>
                  <option value="MANUAL_REVIEW">Manual Review (Pending Verification)</option>
                  <option value="API_POLL">Server API Verification</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  API Key / Token <span className="text-muted-foreground font-normal">(Optional, server-only)</span>
                </label>
                <input
                  type="password"
                  placeholder="Secret API token"
                  value={providerForm.apiKey}
                  onChange={(e) => setProviderForm({ ...providerForm, apiKey: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Webhook Secret <span className="text-muted-foreground font-normal">(For HMAC validation)</span>
                </label>
                <input
                  type="password"
                  placeholder="HMAC verification secret"
                  value={providerForm.webhookSecret}
                  onChange={(e) => setProviderForm({ ...providerForm, webhookSecret: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Permitted Domains</label>
                <input
                  type="text"
                  placeholder="gplinks.co, gplinks.in (comma-separated)"
                  value={providerForm.permittedDomains}
                  onChange={(e) => setProviderForm({ ...providerForm, permittedDomains: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProviderModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border font-semibold text-xs hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProvider}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSubmittingProvider ? 'Saving...' : 'Save Provider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
