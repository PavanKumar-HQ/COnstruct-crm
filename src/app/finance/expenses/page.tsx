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
  const expenses = [
    {
      id: "EXP-2026-0089",
      date: "28 Oct 2026",
      vendor: "UltraTech Cement Ltd",
      category: "Materials (RMC M35)",
      project: "Prestige Horizon Tower 4",
      amount: "₹1,450,000",
      tax: "₹261,000",
      total: "₹1,711,000",
      status: "APPROVED",
      paymentStatus: "PAID",
    },
    {
      id: "EXP-2026-0088",
      date: "27 Oct 2026",
      vendor: "Tata Steel Ltd (Tiscon Fe550D)",
      category: "Materials (Rebar Reinforcement)",
      project: "Prestige Horizon Tower 4",
      amount: "₹3,200,000",
      tax: "₹576,000",
      total: "₹3,776,000",
      status: "APPROVED",
      paymentStatus: "PAID",
    },
    {
      id: "EXP-2026-0087",
      date: "26 Oct 2026",
      vendor: "Action Construction Equipment (ACE)",
      category: "Equipment (Tower Crane Rental)",
      project: "Prestige Horizon Tower 4",
      amount: "₹280,000",
      tax: "₹50,400",
      total: "₹330,400",
      status: "PENDING_PAYMENT",
      paymentStatus: "UNPAID",
    },
  ];

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Committed Costs
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">₹5,817,400</div>
            <div className="text-[11px] text-slate-500 mt-1">Direct jobsite commitments recorded</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Paid to Suppliers
            </span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">₹5,487,000</div>
            <div className="text-[11px] text-slate-500 mt-1">UltraTech & Tata Steel disbursements</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Outstanding Supplier Bills
            </span>
            <div className="text-2xl font-bold text-amber-600 mt-1">₹330,400</div>
            <div className="text-[11px] text-slate-500 mt-1">Tower crane hire due next week</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Cost Entries & Vouchers
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Phase 6 Expense Control Foundation
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3 px-4">Voucher #</th>
                  <th className="py-3 px-4">Supplier / Payee</th>
                  <th className="py-3 px-4">Category & Cost Code</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Total with Tax</th>
                  <th className="py-3 px-4">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{e.id}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{e.vendor}</td>
                    <td className="py-3 px-4 text-slate-600">{e.category}</td>
                    <td className="py-3 px-4 text-slate-500">{e.project}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{e.amount}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{e.total}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          e.paymentStatus === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {e.paymentStatus}
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

