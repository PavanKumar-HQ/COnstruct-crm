"use client";

import React, { useEffect, useState } from "react";
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
  Target,
  RefreshCw
} from "lucide-react";

interface ActivityItem {
  id: string;
  subject: string;
  type: string;
  priority: string;
  status: string;
  dueDate: string | null;
  lead?: { id: string; title: string } | null;
  customer?: { id: string; name: string } | null;
  assignedTo?: { id: string; fullName: string } | null;
}

export default function MyWorkPage() {
  const [tasks, setTasks] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let res = await fetch("/api/activities");
      if (!res.ok && res.status === 401) {
        await fetch("/api/auth/demo-session", { method: "POST" });
        res = await fetch("/api/activities");
      }
      if (res.ok) {
        const data = await res.json();
        setTasks(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

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
          <button
            onClick={fetchTasks}
            className="liquid-glass-button-secondary text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 text-slate-700 hover:text-slate-900 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading operational tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="liquid-glass-card rounded-2xl p-12 text-center border border-white/60">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3 opacity-80" />
            <h3 className="text-sm font-semibold text-slate-800">All Action Items Cleared</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are no pending tasks assigned in this workspace. Create follow-up tasks directly from leads or customers.
            </p>
            <Link
              href="/crm"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 liquid-glass-button-primary text-white text-xs font-semibold rounded-xl shadow-xs"
            >
              Open CRM & Leads &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((t) => (
              <div
                key={t.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-4 hover:border-indigo-400 transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      t.status === "COMPLETED"
                        ? "bg-emerald-500"
                        : t.dueDate && new Date(t.dueDate) < new Date()
                        ? "bg-red-500"
                        : "bg-amber-500"
                    }`}
                  />
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{t.subject}</h3>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {t.lead?.title || t.customer?.name || "General"} •{" "}
                      {t.dueDate ? (
                        <span>Due: <span className="font-semibold text-slate-700">{new Date(t.dueDate).toLocaleDateString()}</span></span>
                      ) : (
                        <span>No due date</span>
                      )}
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
                    className="liquid-glass-button-secondary text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                  >
                    Open in CRM &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

