"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/Shell";
import {
  BookOpen,
  Building2,
  Calendar,
  AlertTriangle,
  Plus,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Bookmark,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";

export default function KnowledgeBasePage() {
  const articles = [
    {
      id: "KB-SOP-01",
      title: "Mass Raft Concrete Pouring & Temperature Monitoring Protocol",
      category: "Site Engineering SOP",
      tags: ["Concrete", "M35/M40", "Thermal Cracking", "Curing"],
      author: "Rajesh Kulkarni (Chief QS)",
      version: "v2.1",
      updatedAt: "24 Oct 2026",
      status: "APPROVED",
    },
    {
      id: "KB-SOP-02",
      title: "Laser Screed Heavy-Duty Industrial Flooring FM2 Tolerances",
      category: "Quality Assurance Standard",
      tags: ["Flooring", "FM2", "Warehouse", "Surface Regularity"],
      author: "Suresh Menon (Project Lead)",
      version: "v1.4",
      updatedAt: "19 Oct 2026",
      status: "APPROVED",
    },
    {
      id: "KB-LESSON-01",
      title: "Lessons Learned: Deep Basement Dewatering in High Water-Table Zones",
      category: "Project Post-Mortem",
      tags: ["Substructure", "Wellpoint Dewatering", "Soil Stability"],
      author: "Vikram Malhotra (MD)",
      version: "v1.0",
      updatedAt: "15 Oct 2026",
      status: "APPROVED",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                <BookOpen className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Operational Knowledge Base & Lessons Learned
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Standard operating procedures, quality specifications, site safety guidelines, and institutional memory.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {articles.map((art) => (
            <div key={art.id} className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between space-y-3 hover:border-indigo-400 transition">
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span className="font-mono">{art.id} • {art.version}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    {art.status}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-900 leading-snug">{art.title}</h3>
                <div className="text-[11px] text-indigo-600 font-medium mt-1">{art.category}</div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {art.tags.map((t) => (
                    <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                <span>By {art.author}</span>
                <span className="text-indigo-600 font-medium hover:underline cursor-pointer">
                  Read SOP &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

