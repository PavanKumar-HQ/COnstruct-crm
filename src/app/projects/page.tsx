"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/Shell";
import {
  FolderKanban,
  Building2,
  Calendar,
  AlertTriangle,
  Plus,
  ArrowRight,
  TrendingUp,
  HardHat,
  CheckCircle2,
  Clock,
  Layers
} from "lucide-react";

export default function ProjectsPage() {
  const demoProjects = [
    {
      id: "PRJ-2026-001",
      code: "PRJ-001",
      name: "Prestige Horizon Tower 4 Substructure & Core",
      client: "Prestige Horizon Tech Parks Ltd",
      location: "Bellandur, Bangalore",
      contractValue: "₹48,263,500",
      spentValue: "₹14,200,000",
      progress: 32,
      health: "HEALTHY",
      status: "IN_EXECUTION",
      pm: "Ananya Sharma",
      targetDate: "Nov 2027",
    },
    {
      id: "PRJ-2026-002",
      code: "PRJ-002",
      name: "Brigade Logistics Heavy Duty PEB Warehouse",
      client: "Brigade Industrial Logistics Hub",
      location: "Hoskote Industrial Area, Bangalore",
      contractValue: "₹28,000,000",
      spentValue: "₹2,100,000",
      progress: 10,
      health: "HEALTHY",
      status: "MOBILISATION",
      pm: "Suresh Menon",
      targetDate: "Jun 2027",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                <FolderKanban className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Project Portfolio & Execution Register
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active construction jobsites, milestone schedules, physical progress tracking, and contract execution.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/site"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition"
            >
              <HardHat className="w-3.5 h-3.5" />
              Site Daily Logs &rarr;
            </Link>
          </div>
        </div>

        {/* Project KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Contract Book
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              ₹76,263,500
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              2 active construction projects under delivery
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Current Project Health
            </div>
            <div className="text-2xl font-bold text-emerald-600 mt-1 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6" />
              100% On-Track
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Zero critical schedule or cost variances reported
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Labour Deployed Today
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              142 Personnel
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Across Bellandur Tower 4 & Hoskote Warehouse
            </div>
          </div>
        </div>

        {/* Projects Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Active Jobsite Register
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Phase 4 Implementation Foundation
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Project Lead</th>
                  <th className="py-3 px-4">Contract Value</th>
                  <th className="py-3 px-4">Cost Incurred</th>
                  <th className="py-3 px-4">Physical Progress</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {demoProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{p.code} • {p.location}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{p.client}</td>
                    <td className="py-3 px-4 text-slate-600">{p.pm}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.contractValue}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{p.spentValue}</td>
                    <td className="py-3 px-4">
                      <div className="w-28 bg-slate-200 rounded-full h-2 overflow-hidden mb-1">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-semibold text-slate-600">
                        {p.progress}% Complete
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
                        {p.status}
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
