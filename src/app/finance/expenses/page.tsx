"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/Shell";
import {
  Receipt,
  Building2,
  Calendar,
  AlertTriangle,
  Plus,
  ArrowRight,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  Package
} from "lucide-react";

export default function ExpensesCostControlPage() {
  const expenses: any[] = [];

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                <Receipt className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Jobsite Expenses, Cost Codes & Supplier Payables
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Direct materials, labour payroll, equipment rentals, and subcontract claims mapped to estimate cost codes.
            </p>
          </div>
        </div>

        {expenses.length === 0 ? (
          <div className="liquid-glass-card rounded-2xl p-12 text-center border border-white/60">
            <Receipt className="w-10 h-10 text-purple-500 mx-auto mb-3 opacity-80" />
            <h3 className="text-sm font-semibold text-slate-800">No Jobsite Expenses Logged</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Material invoices, plant hire vouchers, and subcontractor claims will be audited here once expenses are booked against active projects.
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
                Cost Entries & Vouchers
              </span>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

