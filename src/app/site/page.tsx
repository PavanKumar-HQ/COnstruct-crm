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
  const dailyLogs = [
    {
      id: "LOG-2026-0042",
      date: "Today, 29 Oct 2026",
      project: "Prestige Horizon Tower 4",
      weather: "Clear, 28°C",
      headcount: 84,
      workDone: "Completed M35 concrete pour for Basement 2 shear wall B-4 (145 cu.m). Curing ongoing for grid 3 raft slab.",
      inspections: "Cube test samples taken (6 sets). Slump recorded at 135mm.",
      status: "APPROVED",
      engineer: "Suresh Menon",
    },
    {
      id: "LOG-2026-0041",
      date: "Yesterday, 28 Oct 2026",
      project: "Brigade Logistics Warehouse",
      weather: "Partly Cloudy, 29°C",
      headcount: 58,
      workDone: "Laser screed compaction on Bay 3 heavy-duty flooring. Rebar cages tied for Pedestals P12 through P18.",
      inspections: "Laser flatness audit passed FM2 standard tolerances.",
      status: "APPROVED",
      engineer: "Arun Prasad",
    },
  ];

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
        </div>

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
      </div>
    </AppShell>
  );
}

