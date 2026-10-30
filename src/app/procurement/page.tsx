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
  const purchaseOrders = [
    {
      id: "PO-2026-0034",
      supplier: "UltraTech Cement Ltd",
      project: "Prestige Horizon Tower 4",
      items: "Ready Mix Concrete M35 (450 cu.m)",
      totalAmount: "₹2,430,000",
      status: "APPROVED",
      deliveryStatus: "PARTIALLY_DELIVERED",
      deliveryDate: "02 Nov 2026",
    },
    {
      id: "PO-2026-0033",
      supplier: "Tata Steel Ltd",
      project: "Prestige Horizon Tower 4",
      items: "Tiscon Fe550D Rebars 16mm & 25mm (40 MT)",
      totalAmount: "₹2,460,000",
      status: "APPROVED",
      deliveryStatus: "DELIVERED",
      deliveryDate: "27 Oct 2026",
    },
  ];

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

        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Committed Purchase Orders
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Phase 5 Procurement Flow
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
      </div>
    </AppShell>
  );
}

