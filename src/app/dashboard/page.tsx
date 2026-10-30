"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/Shell";
import {
  Building2,
  Users,
  FileSpreadsheet,
  FileCheck,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowRight,
  Sparkles,
  Calendar,
  CheckCircle2,
  RefreshCw,
  FolderGit2
} from "lucide-react";

interface DashboardData {
  organizationId: string;
  kpis: {
    activeClients: number;
    pipelineLeads: number;
    approvedEstimates: number;
    issuedQuotations: number;
    totalQuotedValue: string;
    totalApprovedEstimateValue: string;
    pendingTasks: number;
    scheduledSiteVisits: number;
  };
  pipelineBreakdown: Array<{ status: string; count: number }>;
  actionCentre: Array<{
    id: string;
    subject: string;
    dueDate: string | null;
    priority: string;
    leadTitle?: string;
    assignedTo?: string;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    user: string;
    createdAt: string;
  }>;
  recentLeads: Array<{
    id: string;
    title: string;
    source: string;
    status: string;
    priority: string;
    estimatedBudget: string | null;
    contactName: string | null;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) {
        if (res.status === 401) {
          // Attempt auto demo login if not authenticated
          const loginRes = await fetch("/api/auth/demo-session", { method: "POST" });
          if (loginRes.ok) {
            const retryRes = await fetch("/api/dashboard");
            if (retryRes.ok) {
              const retryData = await retryRes.json();
              setData(retryData);
              return;
            }
          }
          throw new Error("Unauthorized. Please activate demo session from the sidebar.");
        }
        throw new Error("Failed to load dashboard metrics");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (amountStr: string) => {
    const val = parseFloat(amountStr || "0");
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Executive Operations Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Live operational metrics, commercial pipeline, and risk indicators backed strictly by relational records.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
              Refresh
            </button>
            <Link
              href="/crm"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 rounded-lg text-xs font-medium text-white hover:bg-indigo-700 transition"
            >
              Pipeline Operations &rarr;
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchDashboardData}
              className="px-2.5 py-1 bg-amber-600 text-white rounded font-medium text-[11px]"
            >
              Retry
            </button>
          </div>
        )}

        {/* KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Clients
              </span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {data?.kpis.activeClients ?? 0}
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Verified corporate accounts</span>
              <Link href="/crm?tab=customers" className="text-indigo-600 font-medium hover:underline">
                View all &rarr;
              </Link>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Qualified Pipeline
              </span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {data?.kpis.pipelineLeads ?? 0}
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Active construction tenders</span>
              <Link href="/crm" className="text-indigo-600 font-medium hover:underline">
                View all &rarr;
              </Link>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Approved Baseline BOQs
              </span>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(data?.kpis.totalApprovedEstimateValue || "0")}
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
              <span>{data?.kpis.approvedEstimates ?? 0} estimates approved</span>
              <Link href="/crm?tab=estimates" className="text-indigo-600 font-medium hover:underline">
                View all &rarr;
              </Link>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Issued Formal Quotations
              </span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <FileCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(data?.kpis.totalQuotedValue || "0")}
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
              <span>{data?.kpis.issuedQuotations ?? 0} commercial bids</span>
              <Link href="/quotations" className="text-indigo-600 font-medium hover:underline">
                View all &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* 2-Column Section: Real Pipeline Stage Bar Chart & Action Centre */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Real Database Pipeline Visual Chart */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Pipeline Stage Distribution (Live Database)
                </h2>
              </div>
              <Link href="/pipeline" className="text-xs text-indigo-600 font-medium hover:underline">
                Open Kanban &rarr;
              </Link>
            </div>

            {data?.pipelineBreakdown && data.pipelineBreakdown.length > 0 ? (
              <div className="space-y-3 pt-1">
                {data.pipelineBreakdown.map((item) => {
                  const total = data.kpis.pipelineLeads || 1;
                  const pct = Math.round((item.count / total) * 100);
                  const stageLabels: Record<string, string> = {
                    NEW: "New Enquiry",
                    QUALIFIED: "Qualified",
                    SITE_VISIT_SCHEDULED: "Site Visit Scheduled",
                    ESTIMATION: "BOQ / Estimation",
                    QUOTATION_SENT: "Proposal / Bid Sent",
                    WON: "Contract Awarded",
                    LOST: "Lost / Closed",
                  };
                  return (
                    <div key={item.status} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">
                          {stageLabels[item.status] || item.status}
                        </span>
                        <span className="font-mono text-slate-500 font-semibold">
                          {item.count} deals ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No pipeline deals recorded in database.
              </div>
            )}
          </div>

          {/* Action Centre */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-900">
                  Operational Action Centre
                </h2>
              </div>
              <Link href="/crm" className="text-xs text-indigo-600 font-medium hover:underline">
                View all tasks &rarr;
              </Link>
            </div>

            {data?.actionCentre && data.actionCentre.length > 0 ? (
              <div className="space-y-3">
                {data.actionCentre.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-50 flex items-start justify-between gap-3 transition"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900">
                        {task.subject}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {task.leadTitle && <span>Project: {task.leadTitle} • </span>}
                        {task.assignedTo && <span>Owner: {task.assignedTo}</span>}
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-red-100 text-red-700 font-semibold flex-shrink-0">
                      Overdue
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                No overdue operational activities detected.
              </div>
            )}
          </div>

          {/* Recent Leads Preview */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Recent Commercial Pipeline
                </h2>
              </div>
              <Link href="/crm" className="text-xs text-indigo-600 font-medium hover:underline">
                View all Leads &rarr;
              </Link>
            </div>

            {data?.recentLeads && data.recentLeads.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {data.recentLeads.map((lead) => (
                  <div key={lead.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-900">{lead.title}</div>
                      <div className="text-[11px] text-slate-500">
                        {lead.contactName ? `${lead.contactName} • ` : ""}
                        Source: {lead.source}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700">
                        {lead.status}
                      </span>
                      {lead.estimatedBudget && (
                        <div className="text-[11px] font-mono text-slate-700 mt-0.5">
                          {formatCurrency(lead.estimatedBudget)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No active leads in database.
              </div>
            )}
          </div>
        </div>

        {/* Recent Audit Log */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-bold text-slate-900">
                Immutable Audit Trail (Recent Events)
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Append-Only Database Log</span>
          </div>

          {data?.recentActivity && data.recentActivity.length > 0 ? (
            <div className="space-y-2">
              {data.recentActivity.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-lg bg-slate-50 text-xs flex items-center justify-between font-mono"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded font-semibold text-[10px]">
                      {log.action}
                    </span>
                    <span className="text-slate-700">{log.entityType}</span>
                    <span className="text-slate-400">by {log.user}</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">
                    {log.createdAt ? new Date(log.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-slate-400">
              No audit logs recorded yet.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

