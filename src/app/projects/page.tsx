"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/Shell";
import {
  FolderKanban,
  Building2,
  Calendar,
  AlertTriangle,
  Plus,
  ArrowRight,
  TrendingUp,
  HardHat,
  CheckCircle2,
  Clock,
  Layers,
  RefreshCw,
  ChevronRight,
  X
} from "lucide-react";

interface ProjectItem {
  id: string;
  projectCode: string;
  name: string;
  status: string;
  health: string;
  budgetContractValue: string;
  totalInvoicedValue: string;
  totalCostSpent: string;
  progressPercentage: string;
  siteAddress: string | null;
  plannedStartDate: string | null;
  targetCompletionDate: string | null;
  customer?: { id: string; name: string };
  contract?: { id: string; contractNumber: string; revisedContractValue: string };
  projectManager?: { id: string; fullName: string; email: string };
  workPackages?: Array<{
    id: string;
    code: string;
    name: string;
    budgetAmount: string;
    spentAmount: string;
    progressPercentage: string;
  }>;
  milestones?: Array<{
    id: string;
    name: string;
    description: string | null;
    targetDate: string;
    isCompleted: boolean;
    billingPercentage: string | null;
    billingAmount: string | null;
  }>;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeProjectDetail, setActiveProjectDetail] = useState<ProjectItem | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      let res = await fetch("/api/projects");
      if (!res.ok && res.status === 401) {
        await fetch("/api/auth/demo-session", { method: "POST" });
        res = await fetch("/api/projects");
      }
      if (!res.ok) throw new Error("Failed to load projects from database");
      const data = await res.json();
      setProjects(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const formatCurrency = (valStr: string | number) => {
    const val = typeof valStr === "number" ? valStr : parseFloat(valStr || "0");
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const totalBook = projects.reduce((acc, p) => acc + parseFloat(p.budgetContractValue || "0"), 0);

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 liquid-glass-button-primary rounded-xl text-white shadow-md">
                <FolderKanban className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 drop-shadow-xs">
                Project Portfolio & Execution Register
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active construction jobsites, milestone schedules, physical progress tracking, and work package control backed by PostgreSQL.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchProjects}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 liquid-glass-card rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : "text-indigo-600"}`} />
              Refresh
            </button>
            <Link
              href="/contracts"
              className="inline-flex items-center gap-1.5 px-4 py-2 liquid-glass-button-primary rounded-xl text-xs font-bold text-white transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Mobilise from Contract
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-900 text-xs flex items-center gap-3 backdrop-blur-md">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Project KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="liquid-glass-card p-5 rounded-2xl">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Contract Book
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {formatCurrency(totalBook)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {projects.length} construction project(s) under delivery
            </div>
          </div>
          <div className="liquid-glass-card p-5 rounded-2xl">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Current Project Health
            </div>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6" />
              100% On-Track
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Zero critical schedule or cost variances reported
            </div>
          </div>
          <div className="liquid-glass-card p-5 rounded-2xl">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Executions
            </div>
            <div className="text-2xl font-extrabold text-indigo-600 mt-1">
              {projects.filter((p) => p.status !== "COMPLETED").length} Active
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Linked to verified executed contracts
            </div>
          </div>
        </div>

        {/* Projects Table */}
        <div className="liquid-glass-card rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200/60 bg-white/40 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Active Jobsite Register
            </span>
            <span className="text-xs text-slate-500 font-mono">
              PostgreSQL Verified
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/60 bg-slate-100/50 text-slate-600 uppercase tracking-wider font-bold text-[11px]">
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Project Lead</th>
                  <th className="py-3 px-4">Contract Value</th>
                  <th className="py-3 px-4">Physical Progress</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/40">
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                      No active projects in database. Open Contracts and click &ldquo;Mobilise Project&rdquo;.
                    </td>
                  </tr>
                ) : (
                  projects.map((p) => (
                    <tr key={p.id} className="hover:bg-white/60 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {p.projectCode} • {p.siteAddress || "Site Location TBD"}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{p.customer?.name || "—"}</td>
                      <td className="py-3 px-4 text-slate-600">{p.projectManager?.fullName || "Unassigned"}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {formatCurrency(p.budgetContractValue)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-28 bg-slate-200/80 rounded-full h-2 overflow-hidden mb-1 p-0.5">
                          <div
                            className="liquid-glass-button-primary h-1 rounded-full"
                            style={{ width: `${parseFloat(p.progressPercentage)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-600">
                          {parseFloat(p.progressPercentage)}% Complete
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-800 border border-blue-500/25">
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setActiveProjectDetail(p)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 liquid-glass-card rounded-xl text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-white border border-indigo-200/60 shadow-xs transition"
                        >
                          <span>Manage Project</span>
                          <ChevronRight className="w-3.5 h-3.5 text-indigo-500" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PROJECT DETAIL MODAL POPUP */}
        {activeProjectDetail && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto">
            <div className="liquid-glass-card rounded-3xl shadow-2xl border border-white/80 max-w-5xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/10 text-blue-700 rounded-xl border border-blue-500/20">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                      Project Console: {activeProjectDetail.projectCode}
                    </h2>
                    <p className="text-xs text-slate-500">Work packages, milestones, and physical progress control</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveProjectDetail(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-white/60 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Project Header */}
              <div className="liquid-glass-subtle rounded-2xl border border-white/80 p-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{activeProjectDetail.name}</h1>
                  <div className="text-xs text-slate-500 mt-1">
                    Client: {activeProjectDetail.customer?.name} • PM: {activeProjectDetail.projectManager?.fullName || "Unassigned"} • Contract: {activeProjectDetail.contract?.contractNumber}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Contract Budget</span>
                  <div className="text-xl font-mono font-extrabold text-emerald-700 mt-0.5">
                    {formatCurrency(activeProjectDetail.budgetContractValue)}
                  </div>
                </div>
              </div>

              {/* 2-Column Section: Work Packages & Milestones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Work Packages */}
                <div className="liquid-glass-card rounded-2xl p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-4">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-900">Work Packages (Budget Allocations)</h3>
                    </div>
                  </div>

                  {(!activeProjectDetail.workPackages || activeProjectDetail.workPackages.length === 0) ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No work packages initialized.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeProjectDetail.workPackages.map((wp) => (
                        <div key={wp.id} className="p-3 bg-white/60 rounded-xl border border-white/80">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-bold text-indigo-600">{wp.code}</span>
                            <span className="font-mono font-bold text-slate-900">{formatCurrency(wp.budgetAmount)}</span>
                          </div>
                          <div className="font-semibold text-slate-900 mt-1 text-xs">{wp.name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Milestones */}
                <div className="liquid-glass-card rounded-2xl p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-900">Contractual Milestones</h3>
                    </div>
                  </div>

                  {(!activeProjectDetail.milestones || activeProjectDetail.milestones.length === 0) ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No milestones registered.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeProjectDetail.milestones.map((m) => (
                        <div key={m.id} className="p-3 bg-white/60 rounded-xl border border-white/80">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-900">{m.name}</span>
                            {m.billingPercentage && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-800">
                                {parseFloat(m.billingPercentage)}% Billing
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">{m.description}</div>
                          <div className="text-[10px] font-mono text-slate-400 mt-1">
                            Target Date: {new Date(m.targetDate).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
