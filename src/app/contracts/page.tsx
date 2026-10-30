"use client";

import React from "react";
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
  CheckCircle2
} from "lucide-react";

export default function ContractsPage() {
  const contracts = [
    {
      id: "CTR-2026-001",
      number: "CTR-2026-001",
      title: "Prestige Horizon Tower 4 - Turnkey RCC Superstructure",
      client: "Prestige Horizon Tech Parks Ltd",
      originalValue: "₹48,263,500",
      approvedChangeOrders: "₹2,450,000",
      revisedContractValue: "₹50,713,500",
      advanceReceived: "₹4,826,350 (10%)",
      retentionRate: "5% (₹2,535,675)",
      status: "EXECUTED",
      startDate: "15 Nov 2026",
      completionDate: "30 Nov 2027",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                <FileText className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Prime Construction Contracts & Baseline Register
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Legally binding client contracts, approved change order logs, retention terms, and baseline tracking.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Contract Baseline
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">₹48,263,500</div>
            <div className="text-[11px] text-slate-500 mt-1">Original signed commercial baseline</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Approved Change Orders
            </span>
            <div className="text-2xl font-bold text-indigo-600 mt-1">+₹2,450,000</div>
            <div className="text-[11px] text-slate-500 mt-1">1 formal variation approved by client</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Current Revised Contract Value
            </span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">₹50,713,500</div>
            <div className="text-[11px] text-slate-500 mt-1">Baseline + Approved Variations</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Executed Contracts
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Phase 3.3 Rule Engine: Decimal Invariant Protected
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3 px-4">Contract #</th>
                  <th className="py-3 px-4">Title & Client</th>
                  <th className="py-3 px-4">Original Value</th>
                  <th className="py-3 px-4">Change Orders</th>
                  <th className="py-3 px-4">Revised Value</th>
                  <th className="py-3 px-4">Retention</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{c.number}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{c.title}</div>
                      <div className="text-[11px] text-slate-500">{c.client}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">{c.originalValue}</td>
                    <td className="py-3 px-4 font-mono text-indigo-600 font-semibold">{c.approvedChangeOrders}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{c.revisedContractValue}</td>
                    <td className="py-3 px-4 text-slate-600">{c.retentionRate}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

