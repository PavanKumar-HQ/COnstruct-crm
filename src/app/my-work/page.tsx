"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/Shell";
import {
  CheckSquare,
  Building2,
  Calendar,
  AlertTriangle,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  Target
} from "lucide-react";

export default function MyWorkPage() {
  const tasks = [
    {
      id: "TSK-01",
      title: "Review flooring specifications with Manoj Deshmukh",
      project: "Brigade Logistics Warehouse",
      dueDate: "Overdue by 12 hours",
      priority: "HIGH",
      status: "PENDING",
      type: "CALL",
    },
    {
      id: "TSK-02",
      title: "Contract Sign-off & Mobilisation Advance Discussion",
      project: "Prestige Horizon Tower 4",
      dueDate: "Tomorrow at 10:30 AM",
      priority: "URGENT",
      status: "PENDING",
      type: "MEETING",
    },
    {
      id: "TSK-03",
      title: "Elevation level check and bedrock outcrop inspection",
      project: "Sobha Emerald Club House",
      dueDate: "Tomorrow at 2:00 PM",
      priority: "HIGH",
      status: "SCHEDULED",
      type: "SITE_VISIT",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                <CheckSquare className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                My Work, Action Queue & Assigned Tasks
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Personalized operational tasks, upcoming site inspections, milestone approvals, and follow-up activities.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {tasks.map((t) => (
            <div
              key={t.id}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-4 hover:border-indigo-400 transition"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    t.dueDate.includes("Overdue") ? "bg-red-500" : "bg-emerald-500"
                  }`}
                />
                <div>
                  <h3 className="text-xs font-bold text-slate-900">{t.title}</h3>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {t.project} • Due: <span className="font-semibold text-slate-700">{t.dueDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    t.priority === "URGENT" || t.priority === "HIGH"
                      ? "bg-red-50 text-red-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {t.priority}
                </span>
                <Link
                  href="/crm"
                  className="text-xs font-semibold px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition"
                >
                  Open in CRM &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
