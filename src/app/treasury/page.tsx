"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/Shell";
import {
  Wallet,
  Building2,
  Calendar,
  AlertTriangle,
  Plus,
  ArrowRight,
  TrendingUp,
  CreditCard,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck
} from "lucide-react";

export default function TreasuryPage() {
  const accounts = [
    {
      id: "ACC-01",
      name: "HDFC Current Operating Account",
      type: "BANK",
      accountNumber: "•••• •••• 9821",
      balance: "₹18,450,200",
      reconciledStatus: "RECONCILED",
      lastActivity: "28 Oct 2026",
    },
    {
      id: "ACC-02",
      name: "ICICI Project Escrow (Bellandur Tower 4)",
      type: "ESCROW",
      accountNumber: "•••• •••• 4410",
      balance: "₹12,800,000",
      reconciledStatus: "RECONCILED",
      lastActivity: "26 Oct 2026",
    },
    {
      id: "ACC-03",
      name: "Jobsite Petty Cash Fund (Imprest)",
      type: "CASH",
      accountNumber: "SITE-VAULT-01",
      balance: "₹185,000",
      reconciledStatus: "AUDITED",
      lastActivity: "Today",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                <Wallet className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Treasury, Liquidity & Cash Flow Management
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Multi-account cash visibility, project escrow balances, atomic transfers, and transparent cash forecasting.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Available Liquidity
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">₹31,435,200</div>
            <div className="text-[11px] text-slate-500 mt-1">Across 3 verified operational accounts</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Projected Net Cash (30 Days)
            </span>
            <div className="text-2xl font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
              <ArrowUpRight className="w-6 h-6" />
              +₹4,153,600
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Expected RA inflows minus supplier PO dues</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Restricted Escrow Balances
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">₹12,800,000</div>
            <div className="text-[11px] text-slate-500 mt-1">Dedicated client milestone drawdowns</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Configured Bank & Cash Accounts
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Phase 7 Treasury Ledger Integrity
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3 px-4">Account Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Masked Identifier</th>
                  <th className="py-3 px-4">Ledger Balance</th>
                  <th className="py-3 px-4">Reconciliation</th>
                  <th className="py-3 px-4">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-semibold text-slate-900">{acc.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                        {acc.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{acc.accountNumber}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{acc.balance}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        {acc.reconciledStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{acc.lastActivity}</td>
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
