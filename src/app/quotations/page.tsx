"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/Shell";
import {
  FileCheck,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Building2,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  XCircle
} from "lucide-react";

interface QuotationItem {
  id: string;
  quotationNumber: string;
  status: string;
  validUntil: string;
  currentVersion: number;
  paymentTerms: string | null;
  createdAt: string;
  estimate: {
    id: string;
    estimateNumber: string;
    title: string;
  };
  customer?: {
    id: string;
    name: string;
    companyName: string | null;
  } | null;
  lead?: {
    id: string;
    title: string;
  } | null;
  revisions: Array<{
    id: string;
    versionNumber: number;
    subtotalAmount: string;
    taxAmount: string;
    discountAmount: string;
    finalGrandTotal: string;
    status: string;
  }>;
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<QuotationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchQuotations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/quotations");
      if (!res.ok) {
        if (res.status === 401) {
          // Attempt auto demo login
          await fetch("/api/auth/demo-session", { method: "POST" });
          const retry = await fetch("/api/quotations");
          if (retry.ok) {
            const data = await retry.json();
            setQuotations(data.items || []);
            return;
          }
        }
        throw new Error("Failed to load quotations");
      }
      const data = await res.json();
      setQuotations(data.items || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
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
              Commercial Quotations & Bid Proposals
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Client-facing formal quotation documents generated from approved BOQ baseline estimates.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchQuotations}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
              Refresh
            </button>
            <Link
              href="/crm?tab=estimates"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 rounded-lg text-xs font-medium text-white hover:bg-indigo-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              New Quote from Estimate
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

        {/* Quotations List Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search quote number, client, project..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Total Quotations: {quotations.length}
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Loading commercial quotations...
            </div>
          ) : quotations.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <FileCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              No commercial quotations generated yet.
              <div className="mt-2">
                <Link
                  href="/crm?tab=estimates"
                  className="text-indigo-600 font-medium hover:underline text-xs"
                >
                  Go to approved estimates to issue a quotation &rarr;
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                    <th className="py-3 px-4">Quote Number</th>
                    <th className="py-3 px-4">Client / Lead</th>
                    <th className="py-3 px-4">Approved Estimate Baseline</th>
                    <th className="py-3 px-4">Version</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Grand Total</th>
                    <th className="py-3 px-4">Validity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quotations.map((q) => {
                    const currentRev = q.revisions?.[0];
                    return (
                      <tr key={q.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                          {q.quotationNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">
                            {q.customer?.name || q.lead?.title || "Direct Enquiry"}
                          </div>
                          {q.customer?.companyName && (
                            <div className="text-[11px] text-slate-500">
                              {q.customer.companyName}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-slate-600 font-medium">
                            {q.estimate.estimateNumber}
                          </span>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">
                            {q.estimate.title}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          v{q.currentVersion}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              q.status === "ISSUED"
                                ? "bg-blue-100 text-blue-800"
                                : q.status === "ACCEPTED"
                                ? "bg-emerald-100 text-emerald-800"
                                : q.status === "REJECTED"
                                ? "bg-red-100 text-red-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {q.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {currentRev ? formatCurrency(currentRev.finalGrandTotal) : "—"}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {new Date(q.validUntil).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

