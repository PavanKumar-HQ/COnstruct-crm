"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/Shell";
import {
  Package,
  Building2,
  Calendar,
  AlertTriangle,
  Plus,
  ArrowRight,
  TrendingUp,
  Warehouse,
  CheckCircle2,
  Layers
} from "lucide-react";

export default function InventoryPage() {
  const materials: any[] = [];

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <Package className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Inventory, Materials & Jobsite Store Movements
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Material catalogues, stock-by-store tracking, goods receipt vouchers, issue slips, and stock valuation.
            </p>
          </div>
        </div>

        {materials.length === 0 ? (
          <div className="liquid-glass-card rounded-2xl p-12 text-center border border-white/60">
            <Package className="w-10 h-10 text-emerald-500 mx-auto mb-3 opacity-80" />
            <h3 className="text-sm font-semibold text-slate-800">No Material Stock Recorded</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Jobsite stores, material inventory valuations, and goods issue registers will populate here as physical inventory is received.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Material Stock Register
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                    <th className="py-3 px-4">Item Code</th>
                    <th className="py-3 px-4">Material Name</th>
                    <th className="py-3 px-4">Store Location</th>
                    <th className="py-3 px-4">Stock on Hand</th>
                    <th className="py-3 px-4">Unit Rate</th>
                    <th className="py-3 px-4">Inventory Valuation</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {materials.map((m) => (
                    <tr key={m.code} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{m.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{m.name}</td>
                      <td className="py-3 px-4 text-slate-600">{m.store}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {m.stockQuantity} {m.unit}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{m.avgUnitCost}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{m.totalValuation}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            m.status === "LOW_STOCK"
                              ? "bg-red-100 text-red-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

