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
  const invoices: any[] = [];

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

        {invoices.length === 0 ? (
          <div className="liquid-glass-card rounded-2xl p-12 text-center border border-white/60">
            <Banknote className="w-10 h-10 text-emerald-500 mx-auto mb-3 opacity-80" />
            <h3 className="text-sm font-semibold text-slate-800">No Client Invoices Issued</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Progressive running account (RA) bills and advance payment certificates will appear here once mobilized projects complete billing milestones.
            </p>
            <div className="flex justify-center gap-3 mt-4">
              <Link
                href="/projects"
                className="liquid-glass-button-primary text-white text-xs font-semibold px-4 py-2 rounded-xl"
              >
                View Active Projects
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Client Running Account Bills
              </span>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

