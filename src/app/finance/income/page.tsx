"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/Shell";
import {
  Banknote,
  Receipt,
  Building2,
  Calendar,
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  Clock
} from "lucide-react";

export default function IncomeInvoicingPage() {
  const invoices = [
    {
      id: "INV-2026-0001",
      number: "RA-BILL-01",
      project: "Prestige Horizon Tower 4",
      client: "Prestige Horizon Tech Parks Ltd",
      grossAmount: "₹4,826,350",
      taxGst: "₹868,743",
      netPayable: "₹5,695,093",
      status: "PAID",
      dueDate: "20 Nov 2026",
      paidDate: "28 Oct 2026",
      type: "Mobilisation Advance",
    },
    {
      id: "INV-2026-0002",
      number: "RA-BILL-02",
      project: "Prestige Horizon Tower 4",
      client: "Prestige Horizon Tech Parks Ltd",
      grossAmount: "₹8,450,000",
      taxGst: "₹1,521,000",
      netPayable: "₹9,971,000",
      status: "ISSUED",
      dueDate: "15 Nov 2026",
      paidDate: null,
      type: "Running Account (Substructure Raft)",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <Banknote className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Income, Progress Billing & Client Invoices
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Progressive Running Account (RA) billing against certified milestone site inspections and collections.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Invoiced Revenue
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">₹15,666,093</div>
            <div className="text-[11px] text-slate-500 mt-1">2 client tax invoices posted</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Collections Received
            </span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">₹5,695,093</div>
            <div className="text-[11px] text-slate-500 mt-1">Reconciled in HDFC Current Account</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Outstanding Receivables
            </span>
            <div className="text-2xl font-bold text-amber-600 mt-1">₹9,971,000</div>
            <div className="text-[11px] text-slate-500 mt-1">Current bill due in 17 days</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Client Running Account Bills
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Phase 6 Accounting Invariants Active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Milestone Description</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Base Amount</th>
                  <th className="py-3 px-4">GST (18%)</th>
                  <th className="py-3 px-4">Total Net</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.number}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{inv.type}</div>
                      <div className="text-[11px] text-slate-500">{inv.project}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{inv.client}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{inv.grossAmount}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{inv.taxGst}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.netPayable}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          inv.status === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {inv.status}
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
