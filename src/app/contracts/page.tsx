"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/Shell";
import {
  FileText,
  FileCheck,
  Building2,
  Calendar,
  AlertTriangle,
  Plus,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  FolderPlus,
  Layers,
  ChevronRight,
  X,
  Clock,
  DollarSign
} from "lucide-react";

interface ContractItem {
  id: string;
  contractNumber: string;
  title: string;
  status: string;
  baselineAmount: string;
  taxAmount: string;
  totalContractValue: string;
  revisedContractValue: string;
  retentionPercentage: string;
  advancePercentage: string;
  startDate: string | null;
  completionDate: string | null;
  customer?: { id: string; name: string };
  quotation?: { id: string; quotationNumber: string };
  changeOrders?: Array<{
    id: string;
    changeOrderNumber: string;
    title: string;
    description: string;
    totalAmount: string;
    status: string;
    createdAt: string;
  }>;
  projects?: Array<{
    id: string;
    projectCode: string;
    name: string;
    status: string;
    progressPercentage: string;
  }>;
}

interface QuotationEligible {
  id: string;
  quotationNumber: string;
  customer?: { id: string; name: string };
  revisions?: Array<{
    finalGrandTotal: string;
    status: string;
  }>;
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [eligibleQuotations, setEligibleQuotations] = useState<QuotationEligible[]>([]);
  const [createForm, setCreateForm] = useState({
    quotationId: "",
    title: "",
    retentionPercentage: 5,
    advancePercentage: 10,
    startDate: "",
    completionDate: "",
    paymentTerms: "",
    scopeOfWork: "",
  });

  const [activeContractDetail, setActiveContractDetail] = useState<ContractItem | null>(null);

  // Change Order Modal
  const [showCOModal, setShowCOModal] = useState(false);
  const [coForm, setCoForm] = useState({
    title: "",
    description: "",
    justification: "",
    amount: "",
    taxAmount: "",
    timeExtensionDays: 0,
  });

  // Project Creation Modal
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: "",
    siteAddress: "",
  });

  const [actionLoading, setActionLoading] = useState(false);

  const fetchContracts = async () => {
    setLoading(true);
    setError(null);
    try {
      let res = await fetch("/api/contracts");
      if (!res.ok && res.status === 401) {
        await fetch("/api/auth/demo-session", { method: "POST" });
        res = await fetch("/api/contracts");
      }
      if (!res.ok) throw new Error("Failed to load contracts from database");
      const data = await res.json();
      setContracts(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotations = async () => {
    try {
      const res = await fetch("/api/quotations");
      if (res.ok) {
        const data = await res.json();
        setEligibleQuotations(data || []);
      }
    } catch {
      // quiet fallback
    }
  };

  useEffect(() => {
    fetchContracts();
    fetchQuotations();
  }, []);

  const formatCurrency = (valStr: string | number) => {
    const val = typeof valStr === "number" ? valStr : parseFloat(valStr || "0");
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quotationId: createForm.quotationId,
          title: createForm.title,
          retentionPercentage: Number(createForm.retentionPercentage),
          advancePercentage: Number(createForm.advancePercentage),
          startDate: createForm.startDate || undefined,
          completionDate: createForm.completionDate || undefined,
          paymentTerms: createForm.paymentTerms || undefined,
          scopeOfWork: createForm.scopeOfWork || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create contract");

      setSuccessMsg(`Contract "${json.contractNumber}" created successfully.`);
      setShowCreateModal(false);
      setCreateForm({
        quotationId: "",
        title: "",
        retentionPercentage: 5,
        advancePercentage: 10,
        startDate: "",
        completionDate: "",
        paymentTerms: "",
        scopeOfWork: "",
      });
      fetchContracts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateChangeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContractDetail) return;
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/contracts/${activeContractDetail.id}/change-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: coForm.title,
          description: coForm.description,
          justification: coForm.justification || undefined,
          amount: parseFloat(coForm.amount),
          taxAmount: coForm.taxAmount ? parseFloat(coForm.taxAmount) : 0,
          timeExtensionDays: Number(coForm.timeExtensionDays),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to submit change order");

      setSuccessMsg(`Change Order "${json.changeOrderNumber}" submitted.`);
      setShowCOModal(false);
      setCoForm({
        title: "",
        description: "",
        justification: "",
        amount: "",
        taxAmount: "",
        timeExtensionDays: 0,
      });
      // refresh detail
      const detailRes = await fetch(`/api/contracts/${activeContractDetail.id}`);
      if (detailRes.ok) setActiveContractDetail(await detailRes.json());
      fetchContracts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveCO = async (coId: string) => {
    if (!activeContractDetail) return;
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/contracts/${activeContractDetail.id}/change-orders/${coId}/approve`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to approve change order");

      setSuccessMsg("Change order approved! Revised Contract Value updated.");
      const detailRes = await fetch(`/api/contracts/${activeContractDetail.id}`);
      if (detailRes.ok) setActiveContractDetail(await detailRes.json());
      fetchContracts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContractDetail) return;
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId: activeContractDetail.id,
          name: projectForm.name,
          siteAddress: projectForm.siteAddress || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create project");

      setSuccessMsg(`Project "${json.projectCode}" created with initial Work Packages & Milestones!`);
      setShowProjectModal(false);
      setProjectForm({ name: "", siteAddress: "" });
      const detailRes = await fetch(`/api/contracts/${activeContractDetail.id}`);
      if (detailRes.ok) setActiveContractDetail(await detailRes.json());
      fetchContracts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // KPI Calculations
  const totalBaseline = contracts.reduce((acc, c) => acc + parseFloat(c.totalContractValue || "0"), 0);
  const totalRevised = contracts.reduce((acc, c) => acc + parseFloat(c.revisedContractValue || "0"), 0);
  const totalCOAmount = totalRevised - totalBaseline;

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 liquid-glass-button-primary rounded-xl text-white shadow-md">
                <FileText className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 drop-shadow-xs">
                Prime Construction Contracts & Baseline Register
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Legally binding client contracts, approved change order logs, retention terms, and baseline tracking backed by PostgreSQL.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchContracts}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 liquid-glass-card rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : "text-indigo-600"}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 liquid-glass-button-primary rounded-xl text-xs font-bold text-white transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Award New Contract
            </button>
          </div>
        </div>

        {/* Feedback Banners */}
        {error && (
          <div className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-900 text-xs flex items-center gap-3 backdrop-blur-md">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-900 rounded-2xl flex items-center gap-3 text-xs backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="liquid-glass-card p-5 rounded-2xl">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Contract Baseline
            </span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {formatCurrency(totalBaseline)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Original signed commercial baseline</div>
          </div>
          <div className="liquid-glass-card p-5 rounded-2xl">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Approved Change Orders
            </span>
            <div className="text-2xl font-extrabold text-indigo-600 mt-1">
              +{formatCurrency(totalCOAmount)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Net approved contract variations</div>
          </div>
          <div className="liquid-glass-card p-5 rounded-2xl">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Current Revised Contract Value
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">
              {formatCurrency(totalRevised)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Baseline + Approved Variations</div>
          </div>
        </div>

        {/* Contracts Table */}
        <div className="liquid-glass-card rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200/60 bg-white/40 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Executed Contracts & Baselines
            </span>
            <span className="text-xs text-slate-500 font-mono">
              PostgreSQL Verified • Decimal Invariant Protected
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/60 bg-slate-100/50 text-slate-600 uppercase tracking-wider font-bold text-[11px]">
                  <th className="py-3 px-4">Contract #</th>
                  <th className="py-3 px-4">Title & Client</th>
                  <th className="py-3 px-4">Baseline Value</th>
                  <th className="py-3 px-4">Revised Value</th>
                  <th className="py-3 px-4">Retention / Advance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Execution Project</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/40">
                {contracts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                      No contracts registered in database. Click &ldquo;Award New Contract&rdquo; to generate one from an accepted quotation.
                    </td>
                  </tr>
                ) : (
                  contracts.map((c) => {
                    const project = c.projects && c.projects[0];
                    return (
                      <tr key={c.id} className="hover:bg-white/60 transition">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-600">{c.contractNumber}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{c.title}</div>
                          <div className="text-[11px] text-slate-500">{c.customer?.name || "—"}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                          {formatCurrency(c.totalContractValue)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                          {formatCurrency(c.revisedContractValue)}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {parseFloat(c.retentionPercentage)}% Ret / {parseFloat(c.advancePercentage)}% Adv
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === "EXECUTED" || c.status === "AMENDED"
                              ? "bg-emerald-500/15 text-emerald-800 border border-emerald-500/25"
                              : "bg-amber-500/15 text-amber-800 border border-amber-500/25"
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {project ? (
                            <Link
                              href="/projects"
                              className="font-mono text-xs text-indigo-600 hover:underline font-bold"
                            >
                              {project.projectCode}
                            </Link>
                          ) : (
                            <span className="text-[11px] text-amber-600 font-medium">Pending Handover</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setActiveContractDetail(c)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 liquid-glass-card rounded-xl text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-white border border-indigo-200/60 shadow-xs transition"
                          >
                            <span>Manage Contract</span>
                            <ChevronRight className="w-3.5 h-3.5 text-indigo-500" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL 1: AWARD NEW CONTRACT FROM QUOTATION */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="liquid-glass-card rounded-3xl shadow-2xl border border-white/80 max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 liquid-glass-button-primary text-white rounded-xl shadow-md">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 leading-tight">Award Prime Contract</h2>
                    <p className="text-xs text-slate-500">Generate legally binding contract baseline from accepted quotation</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-white/60 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateContract} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Select Source Quotation <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={createForm.quotationId}
                    onChange={(e) => {
                      const qId = e.target.value;
                      const q = eligibleQuotations.find((item) => item.id === qId);
                      setCreateForm({
                        ...createForm,
                        quotationId: qId,
                        title: q ? `Prime EPC Contract - ${q.customer?.name || "Client"}` : createForm.title,
                      });
                    }}
                    className="w-full p-2.5 liquid-glass-input rounded-xl text-sm font-medium text-slate-900"
                  >
                    <option value="">-- Choose an accepted or issued quotation --</option>
                    {eligibleQuotations.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.quotationNumber} • {q.customer?.name} • Total: {q.revisions?.[0]?.finalGrandTotal ? formatCurrency(q.revisions[0].finalGrandTotal) : "N/A"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Contract Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    placeholder="e.g. Turnkey Superstructure Contract"
                    className="w-full p-2.5 liquid-glass-input rounded-xl text-sm font-medium text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Retention % <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      required
                      value={createForm.retentionPercentage}
                      onChange={(e) => setCreateForm({ ...createForm, retentionPercentage: Number(e.target.value) })}
                      className="w-full p-2.5 liquid-glass-input rounded-xl text-sm font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Mobilisation Advance % <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      required
                      value={createForm.advancePercentage}
                      onChange={(e) => setCreateForm({ ...createForm, advancePercentage: Number(e.target.value) })}
                      className="w-full p-2.5 liquid-glass-input rounded-xl text-sm font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={createForm.startDate}
                      onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                      className="w-full p-2.5 liquid-glass-input rounded-xl text-sm font-medium text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">Target Completion</label>
                    <input
                      type="date"
                      value={createForm.completionDate}
                      onChange={(e) => setCreateForm({ ...createForm, completionDate: e.target.value })}
                      className="w-full p-2.5 liquid-glass-input rounded-xl text-sm font-medium text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 liquid-glass-subtle rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-6 py-2 liquid-glass-button-primary text-white rounded-xl text-xs font-bold transition shadow-md"
                  >
                    {actionLoading ? "Executing..." : "Execute Contract"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: CONTRACT DETAIL CONSOLE (CHANGE ORDERS + PROJECT HANDOVER) */}
        {activeContractDetail && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto">
            <div className="liquid-glass-card rounded-3xl shadow-2xl border border-white/80 max-w-5xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-700 rounded-xl border border-indigo-500/20">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                      Contract Console: {activeContractDetail.contractNumber}
                    </h2>
                    <p className="text-xs text-slate-500">Live baseline management, change order approvals, and project handover</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveContractDetail(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-white/60 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contract Top Banner */}
              <div className="liquid-glass-subtle rounded-2xl border border-white/80 p-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{activeContractDetail.title}</h1>
                  <div className="text-xs text-slate-500 mt-1">
                    Client: {activeContractDetail.customer?.name} • Retention: {parseFloat(activeContractDetail.retentionPercentage)}% • Advance: {parseFloat(activeContractDetail.advancePercentage)}%
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowCOModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 liquid-glass-button-primary text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ New Change Order</span>
                  </button>
                  {(!activeContractDetail.projects || activeContractDetail.projects.length === 0) ? (
                    <button
                      onClick={() => {
                        setProjectForm({
                          name: activeContractDetail.title,
                          siteAddress: "",
                        });
                        setShowProjectModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>Mobilise Project</span>
                    </button>
                  ) : (
                    <Link
                      href="/projects"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition"
                    >
                      <span>View Project ({activeContractDetail.projects[0].projectCode}) &rarr;</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Commercial Value Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-white/70 rounded-2xl border border-white/80 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Signed Baseline</span>
                  <div className="text-xl font-extrabold font-mono text-slate-900 mt-1">
                    {formatCurrency(activeContractDetail.totalContractValue)}
                  </div>
                </div>
                <div className="p-4 bg-white/70 rounded-2xl border border-white/80 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Current Revised Value</span>
                  <div className="text-xl font-extrabold font-mono text-emerald-700 mt-1">
                    {formatCurrency(activeContractDetail.revisedContractValue)}
                  </div>
                </div>
                <div className="p-4 bg-white/70 rounded-2xl border border-white/80 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Contract Status</span>
                  <div className="mt-1">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-800 border border-emerald-500/25">
                      {activeContractDetail.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Change Orders Section */}
              <div className="liquid-glass-card rounded-2xl p-5 mb-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">Change Orders & Variations Ledger</h3>
                  </div>
                  <span className="text-xs text-slate-400">Strict approval required to adjust revised value</span>
                </div>

                {(!activeContractDetail.changeOrders || activeContractDetail.changeOrders.length === 0) ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No change orders registered on this contract.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200/40">
                    {activeContractDetail.changeOrders.map((co) => (
                      <div key={co.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-indigo-600">{co.changeOrderNumber}</span>
                            <span className="font-bold text-slate-900">{co.title}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              co.status === "APPROVED"
                                ? "bg-emerald-500/15 text-emerald-800"
                                : co.status === "REJECTED"
                                ? "bg-rose-500/15 text-rose-800"
                                : "bg-amber-500/15 text-amber-800"
                            }`}>
                              {co.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 max-w-xl">{co.description}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-extrabold text-slate-900">
                            {formatCurrency(co.totalAmount)}
                          </span>
                          {co.status !== "APPROVED" && (
                            <button
                              onClick={() => handleApproveCO(co.id)}
                              disabled={actionLoading}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                            >
                              Approve Variation
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: SUBMIT CHANGE ORDER */}
        {showCOModal && activeContractDetail && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="liquid-glass-card rounded-3xl shadow-2xl border border-white/80 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
              <h3 className="text-base font-extrabold text-slate-900 mb-1">Issue Contract Change Order</h3>
              <p className="text-xs text-slate-500 mb-4">
                Record scope variation for {activeContractDetail.contractNumber}. Value updates only upon approval.
              </p>

              <form onSubmit={handleCreateChangeOrder} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Variation Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={coForm.title}
                    onChange={(e) => setCoForm({ ...coForm, title: e.target.value })}
                    placeholder="e.g. Additional Subgrade Excavation"
                    className="w-full p-2.5 liquid-glass-input rounded-xl text-sm font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Description & Justification <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={coForm.description}
                    onChange={(e) => setCoForm({ ...coForm, description: e.target.value })}
                    placeholder="Explain technical reason for deviation..."
                    className="w-full p-2.5 liquid-glass-input rounded-xl text-sm font-medium text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Amount (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={coForm.amount}
                      onChange={(e) => setCoForm({ ...coForm, amount: e.target.value })}
                      placeholder="e.g. 250000"
                      className="w-full p-2.5 liquid-glass-input rounded-xl text-sm font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">GST Amount (₹)</label>
                    <input
                      type="number"
                      step="any"
                      value={coForm.taxAmount}
                      onChange={(e) => setCoForm({ ...coForm, taxAmount: e.target.value })}
                      placeholder="e.g. 45000"
                      className="w-full p-2.5 liquid-glass-input rounded-xl text-sm font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => setShowCOModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 liquid-glass-subtle rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-6 py-2 liquid-glass-button-primary text-white rounded-xl text-xs font-bold transition shadow-md"
                  >
                    {actionLoading ? "Submitting..." : "Submit Change Order"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 4: MOBILISE PROJECT FROM CONTRACT */}
        {showProjectModal && activeContractDetail && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="liquid-glass-card rounded-3xl shadow-2xl border border-white/80 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
              <h3 className="text-base font-extrabold text-slate-900 mb-1">Mobilise Project</h3>
              <p className="text-xs text-slate-500 mb-4">
                Creates project record, initial work packages, and contractual billing milestones from {activeContractDetail.contractNumber}.
              </p>

              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Project Execution Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={projectForm.name}
                    onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                    className="w-full p-2.5 liquid-glass-input rounded-xl text-sm font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">Site Address</label>
                  <input
                    type="text"
                    value={projectForm.siteAddress}
                    onChange={(e) => setProjectForm({ ...projectForm, siteAddress: e.target.value })}
                    placeholder="Physical site location..."
                    className="w-full p-2.5 liquid-glass-input rounded-xl text-sm font-medium text-slate-900"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => setShowProjectModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 liquid-glass-subtle rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md"
                  >
                    {actionLoading ? "Mobilising..." : "Confirm & Mobilise Project"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
