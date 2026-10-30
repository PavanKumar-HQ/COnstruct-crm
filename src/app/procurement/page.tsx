"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/Shell";
import {
  Truck,
  Building2,
  Calendar,
  AlertTriangle,
  Plus,
  ArrowRight,
  TrendingUp,
  Package,
  CheckCircle2,
  Clock
} from "lucide-react";

export default function ProcurementPage() {
  const purchaseOrders: any[] = [];

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-orange-100 text-orange-700 rounded-lg">
                <Truck className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Procurement, Purchase Orders & Vendor Management
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Material purchase requisitions, supplier PO issuance, delivery receipt verification, and commitment ledgers.
            </p>
          </div>
        </div>

        {purchaseOrders.length === 0 ? (
          <div className="liquid-glass-card rounded-2xl p-12 text-center border border-white/60">
            <Truck className="w-10 h-10 text-orange-500 mx-auto mb-3 opacity-80" />
            <h3 className="text-sm font-semibold text-slate-800">No Purchase Orders Issued</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Committed purchase orders, vendor agreements, and material delivery trackers will appear here as procurement packages are mobilized.
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
                Committed Purchase Orders
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                    <th className="py-3 px-4">PO Number</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Scope / Materials</th>
                    <th className="py-3 px-4">Project</th>
                    <th className="py-3 px-4">PO Value</th>
                    <th className="py-3 px-4">Delivery</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchaseOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{po.id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{po.supplier}</td>
                      <td className="py-3 px-4 text-slate-700">{po.items}</td>
                      <td className="py-3 px-4 text-slate-500">{po.project}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{po.totalAmount}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{po.deliveryDate}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          {po.status}
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

