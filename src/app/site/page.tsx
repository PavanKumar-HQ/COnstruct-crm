"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/Shell";
import {
  HardHat,
  Calendar,
  CloudSun,
  Users,
  CheckCircle2,
  Clock,
  Camera,
  MapPin,
  AlertTriangle
} from "lucide-react";

export default function SiteOperationsPage() {
  const dailyLogs: any[] = [];

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                <HardHat className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Site Operations & Daily Construction Logs
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Field reports, labour attendance, materials poured, safety audits, and photo evidence from active sites.
            </p>
          </div>
          <Link
            href="/projects"
            className="liquid-glass-button-primary px-3.5 py-1.5 text-xs text-white rounded-xl shadow-xs inline-flex items-center gap-2"
          >
            Projects Register
          </Link>
        </div>

        {dailyLogs.length === 0 ? (
          <div className="liquid-glass-card rounded-2xl p-12 text-center border border-white/60">
            <HardHat className="w-10 h-10 text-amber-500 mx-auto mb-3 opacity-80" />
            <h3 className="text-sm font-semibold text-slate-800">No Daily Site Logs Recorded</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Daily site logs, labour headcount muster rolls, and inspection records will appear here as field engineers record active site progress.
            </p>
            <div className="flex justify-center gap-3 mt-4">
              <Link
                href="/projects"
                className="liquid-glass-button-primary text-white text-xs font-semibold px-4 py-2 rounded-xl"
              >
                View Active Projects
              </Link>
              <Link
                href="/crm"
                className="liquid-glass-button-secondary text-xs font-semibold px-4 py-2 rounded-xl"
              >
                Schedule Site Visit
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dailyLogs.map((log) => (
              <div key={log.id} className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div>
                    <span className="text-xs font-bold text-slate-900">{log.project}</span>
                    <div className="text-[11px] text-slate-500 font-mono">{log.id} • {log.date}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    {log.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Weather</span>
                    <div className="font-medium text-slate-700 mt-0.5 flex items-center gap-1.5">
                      <CloudSun className="w-3.5 h-3.5 text-amber-500" />
                      {log.weather}
                    </div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Labour Attendance</span>
                    <div className="font-medium text-slate-700 mt-0.5 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      {log.headcount} Workers
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Work Executed</span>
                  <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">{log.workDone}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Inspecting Engineer: {log.engineer}</span>
                  <span className="text-indigo-600 font-medium hover:underline cursor-pointer">
                    View Inspection Evidence &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

