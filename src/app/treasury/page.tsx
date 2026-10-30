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
  const accounts: any[] = [];

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

        {accounts.length === 0 ? (
          <div className="liquid-glass-card rounded-2xl p-12 text-center border border-white/60">
            <Wallet className="w-10 h-10 text-blue-500 mx-auto mb-3 opacity-80" />
            <h3 className="text-sm font-semibold text-slate-800">No Bank or Treasury Accounts Configured</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Operating current accounts, escrow funds, and jobsite cash vaults will be reported here once accounts are connected.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Configured Bank & Cash Accounts
              </span>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

