"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/Shell";
import {
  Kanban,
  Building2,
  Calendar,
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Search,
  Filter
} from "lucide-react";

interface LeadItem {
  id: string;
  title: string;
  source: string;
  status: string;
  priority: string;
  estimatedBudget: string | null;
  contactName: string | null;
  siteAddress: string | null;
  createdAt: string;
  customer?: { id: string; name: string } | null;
}

const PIPELINE_STAGES = [
  { key: "NEW", label: "New Enquiry", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { key: "QUALIFIED", label: "Qualified", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { key: "SITE_VISIT_SCHEDULED", label: "Site Inspection", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { key: "ESTIMATION", label: "BOQ & Estimation", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { key: "QUOTATION_SENT", label: "Proposal / Bid Sent", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  { key: "WON", label: "Contract Awarded", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
];

export default function PipelinePage() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      let res = await fetch("/api/leads");
      if (!res.ok && res.status === 401) {
        await fetch("/api/auth/demo-session", { method: "POST" });
        res = await fetch("/api/leads");
      }
      if (!res.ok) throw new Error("Failed to load pipeline leads");
      const data = await res.json();
      setLeads(data.items || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const formatCurrency = (amountStr: string | null) => {
    if (!amountStr) return "₹0";
    const val = parseFloat(amountStr);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getStageTotal = (stageKey: string) => {
    const stageLeads = leads.filter((l) => l.status === stageKey);
    const sum = stageLeads.reduce((acc, l) => acc + (l.estimatedBudget ? parseFloat(l.estimatedBudget) : 0), 0);
    return {
      count: stageLeads.length,
      total: formatCurrency(sum.toString()),
    };
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                <Kanban className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Executive Commercial Pipeline
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Visual deal flow across enquiry, technical site qualification, estimation, formal bid, and contract award.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchLeads}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
              Refresh
            </button>
            <Link
              href="/crm?tab=new_lead"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 rounded-lg text-xs font-medium text-white hover:bg-indigo-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Opportunity
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Pipeline Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {PIPELINE_STAGES.map((stage) => {
            const { count, total } = getStageTotal(stage.key);
            return (
              <div key={stage.key} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                  {stage.label}
                </div>
                <div className="text-lg font-bold text-slate-900 mt-1">
                  {count} <span className="text-xs font-normal text-slate-400">deals</span>
                </div>
                <div className="text-[11px] font-mono text-indigo-600 font-medium mt-0.5">
                  {total}
                </div>
              </div>
            );
          })}
        </div>

        {/* Kanban Board Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-6">
          {PIPELINE_STAGES.map((stage) => {
            const stageLeads = leads.filter((l) => l.status === stage.key);
            return (
              <div
                key={stage.key}
                className="bg-slate-100/70 rounded-xl border border-slate-200/80 p-3 flex flex-col min-w-[220px]"
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-bold text-slate-700">{stage.label}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-white border border-slate-200 rounded-full text-slate-600 font-semibold">
                    {stageLeads.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[650px]">
                  {stageLeads.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-slate-400 border border-dashed border-slate-300 rounded-lg">
                      Empty stage
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <Link
                        key={lead.id}
                        href="/crm"
                        className="block bg-white p-3 rounded-lg border border-slate-200 shadow-2xs hover:border-indigo-400 hover:shadow-xs transition group"
                      >
                        <div className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition leading-snug">
                          {lead.title}
                        </div>
                        {lead.contactName && (
                          <div className="text-[11px] text-slate-500 mt-1 truncate">
                            {lead.contactName}
                          </div>
                        )}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="font-mono font-bold text-slate-800">
                            {formatCurrency(lead.estimatedBudget)}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                              lead.priority === "URGENT" || lead.priority === "HIGH"
                                ? "bg-red-50 text-red-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {lead.priority}
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
